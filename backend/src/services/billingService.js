import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { getPlan, PLANS } from '../constants/plans.js';

export function listPlans() {
  return PLANS;
}

export function signPaymentToken({ companyId, email, plan }) {
  return jwt.sign(
    { purpose: 'plan-payment', companyId, email, plan },
    env.jwtSecret,
    { expiresIn: '2h' }
  );
}

export function verifyPaymentToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.purpose !== 'plan-payment') {
    throw Object.assign(new Error('Invalid payment session'), { statusCode: 400 });
  }
  return decoded;
}

export async function activateSubscription(companyId, { plan, paymentId }) {
  const planDef = getPlan(plan);
  if (!planDef) {
    throw Object.assign(new Error('Invalid plan'), { statusCode: 400 });
  }

  const company = await prisma.company.update({
    where: { id: companyId },
    data: {
      plan,
      subscriptionStatus: 'ACTIVE',
      paidAt: new Date(),
      paymentId: paymentId || `pay_${Date.now()}`,
    },
  });

  return company;
}

function ensureRazorpayConfigured() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw Object.assign(
      new Error(
        'Real payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
      ),
      { statusCode: 503 }
    );
  }
}

function getRazorpayClient() {
  ensureRazorpayConfigured();
  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
}

export async function createCheckoutSession({ companyId, plan, customer = {} }) {
  const planDef = getPlan(plan);
  if (!planDef) {
    throw Object.assign(new Error('Invalid plan'), { statusCode: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 });
  }
  const razorpay = getRazorpayClient();
  const amount = Math.round(planDef.price * 100);
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `crm_${companyId.slice(0, 8)}_${Date.now()}`,
    notes: {
      companyId: String(companyId),
      plan: planDef.id,
      companyName: company.name,
    },
  });

  return {
    provider: 'razorpay',
    keyId: env.razorpayKeyId,
    orderId: order.id,
    amount,
    currency: 'INR',
    plan: planDef.id,
    planName: planDef.name,
    companyId,
    description: `${planDef.name} plan subscription`,
    name: 'Sales Lead CRM',
    prefill: {
      name: customer.name || '',
      email: customer.email || company.contactEmail || '',
      contact: customer.phone || company.contactPhone || '',
    },
  };
}

export function verifyRazorpayPayment({ orderId, paymentId, signature }) {
  ensureRazorpayConfigured();
  if (!orderId || !paymentId || !signature) {
    throw Object.assign(new Error('Missing payment verification fields'), { statusCode: 400 });
  }
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(payload)
    .digest('hex');
  if (expected !== signature) {
    throw Object.assign(new Error('Invalid payment signature'), { statusCode: 400 });
  }
}

export async function getSubscription(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      paidAt: true,
      paymentId: true,
      contactEmail: true,
      contactPhone: true,
    },
  });
  if (!company) return null;
  return { ...company, planDetails: getPlan(company.plan) };
}
