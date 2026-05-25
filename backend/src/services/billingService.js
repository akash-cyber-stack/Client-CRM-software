import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
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

/** Mock checkout — replace with Razorpay/Stripe order creation in production */
export async function createCheckoutSession(companyId, plan) {
  const planDef = getPlan(plan);
  if (!planDef) {
    throw Object.assign(new Error('Invalid plan'), { statusCode: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 });
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { plan },
  });

  return {
    orderId: `order_${companyId}_${Date.now()}`,
    amount: planDef.price,
    currency: 'INR',
    plan: planDef.id,
    planName: planDef.name,
    companyId,
    mockPayment: env.nodeEnv !== 'production',
  };
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
