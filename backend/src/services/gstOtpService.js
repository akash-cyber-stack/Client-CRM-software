import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { normalizeGstin } from '../utils/gstin.js';
import { maskEmail, maskPhone, normalizeIndianMobile } from '../utils/maskContact.js';
import { lookupGstRegistry, verifyGstin } from './gstService.js';
import { deliverOtp } from './otpDeliveryService.js';
import { findCompanyByGstin } from './companyService.js';

const OTP_LENGTH = 6;
const OTP_CHARS = '0123456789';

function generateOtp() {
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    otp += OTP_CHARS[Math.floor(Math.random() * OTP_CHARS.length)];
  }
  return otp;
}

function otpExpiry() {
  return new Date(Date.now() + env.gstOtpExpiryMinutes * 60 * 1000);
}

function validateClientContacts(mobile, email) {
  const m = normalizeIndianMobile(mobile);
  const e = String(email || '').trim().toLowerCase();
  if (!m || m.length !== 10) {
    throw Object.assign(new Error('Enter a valid 10-digit mobile number'), { statusCode: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw Object.assign(new Error('Enter a valid email address'), { statusCode: 400 });
  }
  return { mobile: m, email: e, maskedMobile: maskPhone(m), maskedEmail: maskEmail(e) };
}

export function issueGstVerificationToken(gstin, challengeId) {
  return jwt.sign(
    { purpose: 'gst-registration', gstin: normalizeGstin(gstin), challengeId },
    env.jwtSecret,
    { expiresIn: `${env.gstOtpExpiryMinutes * 2}m` }
  );
}

export function assertGstVerificationToken(token, gstin) {
  if (!token) {
    throw Object.assign(new Error('GST OTP verification is required before registration'), {
      statusCode: 400,
      code: 'GST_OTP_REQUIRED',
    });
  }
  if (!env.gstOtpRequired) return null;

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw Object.assign(new Error('GST verification expired. Please verify OTP again.'), {
      statusCode: 400,
      code: 'GST_OTP_EXPIRED',
    });
  }

  if (decoded.purpose !== 'gst-registration' || decoded.gstin !== normalizeGstin(gstin)) {
    throw Object.assign(new Error('Invalid GST verification token'), {
      statusCode: 400,
      code: 'GST_OTP_INVALID',
    });
  }

  return decoded;
}

export async function prepareGstOtpLookup(gstin) {
  const normalized = normalizeGstin(gstin);
  const existing = await findCompanyByGstin(normalized);
  if (existing) {
    throw Object.assign(new Error('This GST number is already registered'), { statusCode: 409 });
  }

  const registry = await lookupGstRegistry(normalized);
  if (!registry.valid) {
    throw Object.assign(new Error(registry.message || 'GST lookup failed'), { statusCode: 400 });
  }

  return registry;
}

/**
 * Send OTP — new clients: pass mobile + email (OTP goes there directly).
 * Admin/registry flow: omit mobile/email to use GST registry contacts.
 */
export async function sendGstOtp({ gstin, channel, mobile, email }) {
  const normalized = normalizeGstin(gstin);

  const existing = await findCompanyByGstin(normalized);
  if (existing) {
    throw Object.assign(new Error('This GST number is already registered'), { statusCode: 409 });
  }

  let deliverMobile = null;
  let deliverEmail = null;
  let maskedMobile = null;
  let maskedEmail = null;
  let legalName = null;
  let gstAddress = null;
  let stateCode = null;
  let ch = String(channel || 'both').toLowerCase();

  if (mobile && email) {
    const client = validateClientContacts(mobile, email);
    const verification = await verifyGstin(normalized);
    if (!verification.valid) {
      throw Object.assign(new Error(verification.message || 'Invalid GST number'), { statusCode: 400 });
    }
    deliverMobile = client.mobile;
    deliverEmail = client.email;
    maskedMobile = client.maskedMobile;
    maskedEmail = client.maskedEmail;
    legalName = verification.legalName;
    gstAddress = verification.address;
    stateCode = verification.stateCode;
    ch = 'both';
  } else {
    const registry = await prepareGstOtpLookup(normalized);
    ch = String(channel || 'sms').toLowerCase();

    if (ch === 'sms' && !registry.mobile) {
      throw Object.assign(new Error('No registered mobile on GST record'), { statusCode: 400 });
    }
    if (ch === 'email' && !registry.email) {
      throw Object.assign(new Error('No registered email on GST record'), { statusCode: 400 });
    }
    if (ch === 'both' && (!registry.mobile || !registry.email)) {
      throw Object.assign(new Error('Both mobile and email required on GST record for this option'), {
        statusCode: 400,
      });
    }

    deliverMobile = ch === 'email' ? null : registry.mobile;
    deliverEmail = ch === 'sms' ? null : registry.email;
    maskedMobile = registry.maskedMobile;
    maskedEmail = registry.maskedEmail;
    legalName = registry.legalName;
    gstAddress = registry.address;
    stateCode = registry.stateCode;
  }

  if (!['sms', 'email', 'both'].includes(ch)) {
    throw Object.assign(new Error('Channel must be sms, email, or both'), { statusCode: 400 });
  }

  await prisma.gstOtpChallenge.deleteMany({
    where: { gstin: normalized, verified: false },
  });

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  const challenge = await prisma.gstOtpChallenge.create({
    data: {
      gstin: normalized,
      mobileTarget: ch === 'email' ? null : deliverMobile,
      emailTarget: ch === 'sms' ? null : deliverEmail,
      otpHash,
      channel: ch,
      legalName,
      gstAddress,
      stateCode,
      expiresAt: otpExpiry(),
    },
  });

  const delivery = await deliverOtp({
    mobile: ch === 'email' ? null : deliverMobile,
    email: ch === 'sms' ? null : deliverEmail,
    otp,
    gstin: normalized,
  });

  if (!delivery.mobile && ch !== 'email') {
    throw Object.assign(
      new Error(
        'SMS not sent. Configure SMS_HTTP_URL in backend/.env or verify using email OTP only.'
      ),
      { statusCode: 503 }
    );
  }

  if (!delivery.email && ch !== 'sms') {
    throw Object.assign(
      new Error(
        'Email not sent. Add SMTP_PASS (Gmail App Password) in backend/.env and restart server.'
      ),
      { statusCode: 503 }
    );
  }

  return {
    challengeId: challenge.id,
    gstin: normalized,
    channel: ch,
    maskedMobile,
    maskedEmail,
    legalName,
    expiresInMinutes: env.gstOtpExpiryMinutes,
    sentToClientContacts: Boolean(mobile && email),
    ...(env.gstOtpDevExpose ? { devOtp: delivery.devOtp || otp } : {}),
  };
}

export async function verifyGstOtp({ gstin, otp, challengeId }) {
  const normalized = normalizeGstin(gstin);
  const code = String(otp || '').trim();
  if (!/^\d{6}$/.test(code)) {
    throw Object.assign(new Error('Enter the 6-digit OTP'), { statusCode: 400 });
  }

  const challenge = challengeId
    ? await prisma.gstOtpChallenge.findFirst({
        where: { id: challengeId, gstin: normalized, verified: false },
      })
    : await prisma.gstOtpChallenge.findFirst({
        where: { gstin: normalized, verified: false },
        orderBy: { createdAt: 'desc' },
      });

  if (!challenge) {
    throw Object.assign(new Error('No active OTP session. Request a new OTP.'), { statusCode: 400 });
  }

  if (challenge.expiresAt < new Date()) {
    throw Object.assign(new Error('OTP expired. Request a new one.'), { statusCode: 400 });
  }

  const match = await bcrypt.compare(code, challenge.otpHash);
  if (!match) {
    throw Object.assign(new Error('Incorrect OTP'), { statusCode: 400 });
  }

  await prisma.gstOtpChallenge.update({
    where: { id: challenge.id },
    data: { verified: true },
  });

  const gstVerificationToken = issueGstVerificationToken(normalized, challenge.id);

  return {
    gstVerificationToken,
    gstin: normalized,
    legalName: challenge.legalName,
    address: challenge.gstAddress,
    stateCode: challenge.stateCode,
    registeredMobile: challenge.mobileTarget,
    registeredEmail: challenge.emailTarget,
  };
}
