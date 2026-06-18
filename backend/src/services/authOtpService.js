import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { maskEmail, maskPhone, normalizeIndianMobile } from '../utils/maskContact.js';
import { deliverAuthPhoneOtp } from './otpDeliveryService.js';

const OTP_LENGTH = 6;
const OTP_CHARS = '0123456789';

let mailTransporter;
let tableReady = false;

function getMailTransporter() {
  if (!env.smtpUser || !env.smtpPass) return null;
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return mailTransporter;
}

async function ensureAuthOtpTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "auth_otp_challenges" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL DEFAULT '',
      "phone" TEXT,
      "purpose" TEXT NOT NULL DEFAULT 'auth',
      "otp_hash" TEXT NOT NULL,
      "verified" BOOLEAN NOT NULL DEFAULT false,
      "expires_at" TIMESTAMP(3) NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "auth_otp_challenges_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "auth_otp_challenges" ADD COLUMN IF NOT EXISTS "phone" TEXT;
  `).catch(() => {});
  tableReady = true;
}

function normalizePhone(phone) {
  const m = normalizeIndianMobile(phone);
  if (!m || m.length !== 10) {
    throw Object.assign(new Error('Enter a valid 10-digit mobile number'), { statusCode: 400 });
  }
  return m;
}

function generateOtp() {
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    otp += OTP_CHARS[Math.floor(Math.random() * OTP_CHARS.length)];
  }
  return otp;
}

function otpExpiryDate() {
  return new Date(Date.now() + env.authOtpExpiryMinutes * 60 * 1000);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function assertEmailVerifyToken(token, email) {
  if (!env.authEmailOtpRequired) return null;

  if (!token) {
    throw Object.assign(new Error('Email verification is required'), {
      statusCode: 400,
      code: 'EMAIL_OTP_REQUIRED',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw Object.assign(new Error('Email verification expired. Verify your code again.'), {
      statusCode: 400,
      code: 'EMAIL_OTP_EXPIRED',
    });
  }

  if (decoded.purpose !== 'email-verified' || decoded.email !== normalizeEmail(email)) {
    throw Object.assign(new Error('Invalid email verification'), {
      statusCode: 400,
      code: 'EMAIL_OTP_INVALID',
    });
  }

  return decoded;
}

export async function sendAuthEmailOtp(email, purpose = 'auth') {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw Object.assign(new Error('Enter a valid email address'), { statusCode: 400 });
  }

  await ensureAuthOtpTable();

  await prisma.$executeRaw`DELETE FROM "auth_otp_challenges" WHERE "email" = ${normalized} AND "verified" = false`;

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const challengeId = crypto.randomUUID();
  const expiresAt = otpExpiryDate();

  await prisma.$executeRaw`
    INSERT INTO "auth_otp_challenges" ("id", "email", "purpose", "otp_hash", "verified", "expires_at")
    VALUES (${challengeId}, ${normalized}, ${purpose}, ${otpHash}, false, ${expiresAt})
  `;

  const transport = getMailTransporter();
  if (!transport) {
    const hint = process.env.VERCEL
      ? 'Add SMTP_USER and SMTP_PASS (Gmail App Password) in Vercel → Project → Settings → Environment Variables, then redeploy.'
      : 'Add SMTP_USER and SMTP_PASS (Gmail App Password) in backend/.env';
    throw Object.assign(new Error(`Email is not configured. ${hint}`), {
      statusCode: 503,
      code: 'SMTP_NOT_CONFIGURED',
    });
  }

  const minutes = env.authOtpExpiryMinutes;
  const mailPayload = {
    from: env.smtpFrom || `"Sales Lead CRM" <${env.smtpUser}>`,
    to: normalized,
    subject: 'Your verification code — Sales Lead CRM',
    text: `Your verification code is: ${otp}\n\nValid for ${minutes} minutes. Do not share this code.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;color:#f8fafc">
        <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#c9a227">Secure verification</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:10px;color:#f4d47a;margin:20px 0">${otp}</p>
        <p style="color:#94a3b8;font-size:14px;margin:0">Valid for ${minutes} minutes.</p>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailPayload);
    return {
      challengeId,
      maskedEmail: maskEmail(normalized),
      expiresInMinutes: env.authOtpExpiryMinutes,
    };
  } catch (err) {
    console.error('[Auth email OTP]', err.message);

    const isAuth =
      String(err.message || '').includes('535') ||
      String(err.message || '').toLowerCase().includes('authentication');

    throw Object.assign(
      new Error(
        isAuth
          ? 'Could not send email. In backend/.env set SMTP_PASS to a Gmail App Password (Google Account → Security → App passwords), not your normal password.'
          : 'Could not send verification email. Check SMTP settings in backend/.env'
      ),
      { statusCode: 503, code: 'SMTP_FAILED' }
    );
  }
}

async function findChallenge(email, challengeId) {
  if (challengeId) {
    const rows = await prisma.$queryRaw`
      SELECT * FROM "auth_otp_challenges"
      WHERE "id" = ${challengeId} AND "email" = ${email} AND "verified" = false
      LIMIT 1
    `;
    return rows[0] || null;
  }
  const rows = await prisma.$queryRaw`
    SELECT * FROM "auth_otp_challenges"
    WHERE "email" = ${email} AND "verified" = false
    ORDER BY "created_at" DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function verifyAuthEmailOtp({ email, otp, challengeId }) {
  await ensureAuthOtpTable();
  const normalized = normalizeEmail(email);
  const code = String(otp || '').trim();
  if (!/^\d{6}$/.test(code)) {
    throw Object.assign(new Error('Enter the 6-digit code'), { statusCode: 400 });
  }

  const challenge = await findChallenge(normalized, challengeId);
  if (!challenge) {
    throw Object.assign(new Error('No active verification. Request a new code.'), { statusCode: 400 });
  }

  const expiresAt = new Date(challenge.expires_at);
  if (expiresAt < new Date()) {
    throw Object.assign(new Error('Code expired. Request a new one.'), {
      statusCode: 400,
      code: 'OTP_EXPIRED',
    });
  }

  const match = await bcrypt.compare(code, challenge.otp_hash);
  if (!match) {
    throw Object.assign(new Error('Incorrect verification code'), {
      statusCode: 400,
      code: 'OTP_INVALID',
    });
  }

  await prisma.$executeRaw`
    UPDATE "auth_otp_challenges" SET "verified" = true WHERE "id" = ${challenge.id}
  `;

  const emailVerifyToken = jwt.sign(
    { purpose: 'email-verified', email: normalized, challengeId: challenge.id },
    env.jwtSecret,
    { expiresIn: '15m' }
  );

  return { emailVerifyToken, email: normalized };
}

export function assertPhoneVerifyToken(token, phone) {
  if (!env.authPhoneOtpRequired) return null;

  if (!token) {
    throw Object.assign(new Error('Phone verification is required'), {
      statusCode: 400,
      code: 'PHONE_OTP_REQUIRED',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw Object.assign(new Error('Phone verification expired. Verify SMS code again.'), {
      statusCode: 400,
      code: 'PHONE_OTP_EXPIRED',
    });
  }

  const normalized = normalizeIndianMobile(phone);
  if (decoded.purpose !== 'phone-verified' || !normalized || decoded.phone !== normalized) {
    throw Object.assign(new Error('Invalid phone verification'), {
      statusCode: 400,
      code: 'PHONE_OTP_INVALID',
    });
  }

  return decoded;
}

export async function sendAuthPhoneOtp(phone, purpose = 'auth') {
  const normalized = normalizePhone(phone);
  await ensureAuthOtpTable();

  await prisma.$executeRaw`
    DELETE FROM "auth_otp_challenges"
    WHERE "phone" = ${normalized} AND "verified" = false
  `;

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const challengeId = crypto.randomUUID();
  const expiresAt = otpExpiryDate();

  await prisma.$executeRaw`
    INSERT INTO "auth_otp_challenges" ("id", "email", "phone", "purpose", "otp_hash", "verified", "expires_at")
    VALUES (${challengeId}, ${''}, ${normalized}, ${purpose}, ${otpHash}, false, ${expiresAt})
  `;

  const delivery = await deliverAuthPhoneOtp(normalized, otp);

  if (!delivery.sent) {
    throw Object.assign(
      new Error(delivery.error || 'Could not send SMS. Check FAST2SMS_API_KEY in backend/.env'),
      { statusCode: 503, code: 'SMS_FAILED' }
    );
  }

  return {
    challengeId,
    maskedPhone: maskPhone(normalized),
    expiresInMinutes: env.authOtpExpiryMinutes,
  };
}

async function findPhoneChallenge(phone, challengeId) {
  if (challengeId) {
    const rows = await prisma.$queryRaw`
      SELECT * FROM "auth_otp_challenges"
      WHERE "id" = ${challengeId} AND "phone" = ${phone} AND "verified" = false
      LIMIT 1
    `;
    return rows[0] || null;
  }
  const rows = await prisma.$queryRaw`
    SELECT * FROM "auth_otp_challenges"
    WHERE "phone" = ${phone} AND "verified" = false
    ORDER BY "created_at" DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function verifyAuthPhoneOtp({ phone, otp, challengeId }) {
  await ensureAuthOtpTable();
  const normalized = normalizePhone(phone);
  const code = String(otp || '').trim();
  if (!/^\d{6}$/.test(code)) {
    throw Object.assign(new Error('Enter the 6-digit code'), { statusCode: 400 });
  }

  const challenge = await findPhoneChallenge(normalized, challengeId);
  if (!challenge) {
    throw Object.assign(new Error('No active verification. Request a new SMS code.'), {
      statusCode: 400,
    });
  }

  const expiresAt = new Date(challenge.expires_at);
  if (expiresAt < new Date()) {
    throw Object.assign(new Error('Code expired. Request a new one.'), {
      statusCode: 400,
      code: 'OTP_EXPIRED',
    });
  }

  const match = await bcrypt.compare(code, challenge.otp_hash);
  if (!match) {
    throw Object.assign(new Error('Incorrect verification code'), {
      statusCode: 400,
      code: 'OTP_INVALID',
    });
  }

  await prisma.$executeRaw`
    UPDATE "auth_otp_challenges" SET "verified" = true WHERE "id" = ${challenge.id}
  `;

  const phoneVerifyToken = jwt.sign(
    { purpose: 'phone-verified', phone: normalized, challengeId: challenge.id },
    env.jwtSecret,
    { expiresIn: '15m' }
  );

  return { phoneVerifyToken, phone: normalized };
}
