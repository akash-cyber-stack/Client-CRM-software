import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let mailTransporter;

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

async function sendEmailOtp(email, otp, gstin) {
  const transport = getMailTransporter();
  if (!transport) return false;

  const minutes = env.gstOtpExpiryMinutes;
  await transport.sendMail({
    from: env.smtpFrom || `"Sales Lead CRM" <${env.smtpUser}>`,
    to: email,
    subject: `GST verification OTP — ${gstin}`,
    text: `Your GST registration OTP is: ${otp}\n\nValid for ${minutes} minutes.\n\n— Sales Lead CRM`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">GST verification</h2>
        <p>Your OTP for GST <strong>${gstin}</strong>:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#111">${otp}</p>
        <p style="color:#666">Valid for ${minutes} minutes.</p>
        <p style="color:#999;font-size:12px">Sales Lead CRM</p>
      </div>
    `,
  });
  return true;
}

async function sendSmsFast2Sms(mobile, otp, gstin) {
  if (!env.fast2smsApiKey) return false;

  const digits = String(mobile).replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return false;

  const message = `Your Sales Lead CRM GST OTP for ${gstin} is ${otp}. Valid ${env.gstOtpExpiryMinutes} min.`;

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: env.fast2smsApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      numbers: digits,
    }),
  });

  const data = await res.json().catch(() => ({}));
  const ok = data?.return === true || (res.ok && Array.isArray(data?.message));
  if (!ok) {
    console.error('[Fast2SMS]', data?.message || data);
  }
  return ok;
}

async function sendSmsHttp(mobile, otp, gstin) {
  if (!env.smsHttpUrl) return false;
  const label = `GST ${gstin}`;
  const res = await fetch(env.smsHttpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: mobile,
      message: `Your ${label} verification OTP is ${otp}. Valid for ${env.gstOtpExpiryMinutes} minutes. — Sales Lead CRM`,
      key: env.smsApiKey,
    }),
  });
  return res.ok;
}

/**
 * Deliver OTP to GST-registered mobile + email (real send when configured).
 */
export async function deliverOtp({ mobile, email, otp, gstin }) {
  const results = { mobile: false, email: false, devOtp: null };

  const canRealEmail = Boolean(env.smtpUser && env.smtpPass);
  const canRealSms = Boolean(env.fast2smsApiKey || env.smsHttpUrl);

  if (env.gstOtpDevExpose && !canRealEmail && !canRealSms) {
    results.devOtp = otp;
  }

  if (mobile) {
    try {
      if (env.fast2smsApiKey) {
        results.mobile = await sendSmsFast2Sms(mobile, otp, gstin);
      } else if (env.smsHttpUrl) {
        results.mobile = await sendSmsHttp(mobile, otp, gstin);
      } else if (!canRealSms) {
        console.warn('[GST OTP] SMS not configured — set FAST2SMS_API_KEY in backend/.env');
      }
    } catch (err) {
      console.error('[GST OTP SMS failed]', err.message);
      results.mobile = false;
    }
  }

  if (email) {
    try {
      if (canRealEmail) {
        results.email = await sendEmailOtp(email, otp, gstin);
      } else if (env.smtpHttpUrl) {
        const res = await fetch(env.smtpHttpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `GST verification OTP — ${gstin}`,
            body: `Your OTP: ${otp}`,
            key: env.smtpApiKey,
          }),
        });
        results.email = res.ok;
      } else {
        console.warn('[GST OTP] Email not configured — set SMTP_USER + SMTP_PASS (Gmail App Password) in backend/.env');
      }
    } catch (err) {
      console.error('[GST OTP Email failed]', err.message);
      results.email = false;
    }
  }

  return results;
}
