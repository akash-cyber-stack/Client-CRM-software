import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listPlans,
  createCheckoutSession,
  activateSubscription,
  getSubscription,
  signPaymentToken,
  verifyPaymentToken,
} from '../services/billingService.js';
import { toSafeUser, userSelectWithCompany } from '../utils/tenant.js';
import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, companyId: user.companyId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export const plans = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: listPlans() });
});

export const subscription = asyncHandler(async (req, res) => {
  const data = await getSubscription(req.companyId);
  res.json({ success: true, data });
});

export const checkout = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const order = await createCheckoutSession(req.companyId, plan);
  res.json({ success: true, data: order });
});

/** After mock/real payment — activate plan (public with paymentToken from register) */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentToken, paymentId, plan } = req.body;

  let companyId;
  let resolvedPlan = plan;

  if (paymentToken) {
    const decoded = verifyPaymentToken(paymentToken);
    companyId = decoded.companyId;
    resolvedPlan = decoded.plan || plan;
  } else if (req.user) {
    companyId = req.companyId;
  } else {
    return res.status(400).json({ success: false, message: 'Payment session required' });
  }

  await activateSubscription(companyId, { plan: resolvedPlan, paymentId });

  const superAdmin = await prisma.user.findFirst({
    where: { companyId, role: 'SUPER_ADMIN' },
    select: userSelectWithCompany(),
  });

  if (!superAdmin) {
    return res.json({
      success: true,
      message: 'Payment successful. You can sign in now.',
      data: { paid: true },
    });
  }

  const token = issueToken(superAdmin);
  res.json({
    success: true,
    message: 'Payment successful',
    data: { token, user: toSafeUser(superAdmin), paid: true },
  });
});

/** Logged-in Super Admin: mock pay to activate */
export const activatePlan = asyncHandler(async (req, res) => {
  const { plan, paymentId } = req.body;
  const resolvedPlan = plan || req.user.company.plan;
  await activateSubscription(req.companyId, { plan: resolvedPlan, paymentId });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userSelectWithCompany(),
  });

  res.json({
    success: true,
    message: 'Subscription activated',
    data: { user: toSafeUser(user), paid: true },
  });
});
