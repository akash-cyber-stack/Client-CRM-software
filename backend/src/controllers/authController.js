import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createCompany,
  hasSuperAdminGlobally,
  hasSuperAdminInCompany,
  assertSubscriptionActive,
} from '../services/companyService.js';
import { signPaymentToken } from '../services/billingService.js';
import { getPlan } from '../constants/plans.js';
import { toSafeUser, userSelectWithCompany } from '../utils/tenant.js';
import {
  getOAuthStartUrl,
  handleOAuthCallback,
  listOAuthProviders,
  oauthErrorRedirect,
  oauthSuccessRedirect,
} from '../services/oauthService.js';

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, companyId: user.companyId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function normalizeWorkspaceName(value) {
  return String(value || '').trim().toLowerCase();
}

async function getCompanyByWorkspaceName(workspaceName) {
  const normalized = normalizeWorkspaceName(workspaceName);
  if (!normalized) return null;

  return prisma.company.findFirst({
    where: { name: { equals: normalized, mode: 'insensitive' } },
  });
}

async function resolveCompanyForExistingWorkspace(companyName) {
  return getCompanyByWorkspaceName(companyName);
}

async function resolveLoginUser(emailLower, companyName) {
  const candidates = await prisma.user.findMany({
    where: { email: emailLower, status: 'ACTIVE' },
    include: { company: true },
  });

  if (!candidates.length) return { user: null, message: 'Invalid email or password' };
  if (candidates.length === 1) return { user: candidates[0], message: null };

  const normalizedCompanyName = normalizeWorkspaceName(companyName);
  if (!normalizedCompanyName) {
    return { user: null, message: 'Please enter your workspace name to continue.' };
  }

  const matched = candidates.find((candidate) => normalizeWorkspaceName(candidate.company?.name) === normalizedCompanyName);
  if (!matched) {
    return { user: null, message: 'Workspace name does not match this email.' };
  }

  return { user: matched, message: null };
}

export const setupStatus = asyncHandler(async (_req, res) => {
  const hasSuperAdmin = await hasSuperAdminGlobally();
  res.json({
    success: true,
    data: {
      hasSuperAdmin,
      hasCompanies: hasSuperAdmin,
      canRegisterSuperAdmin: !hasSuperAdmin,
      oauthProviders: listOAuthProviders(),
    },
  });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, companyName, plan } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const emailLower = email.toLowerCase();
  const existingCompany = await resolveCompanyForExistingWorkspace(companyName);

  if (existingCompany) {
    const requestedRole = role || 'SALES_EMPLOYEE';
    const superAdminExists = await hasSuperAdminInCompany(existingCompany.id);

    if (requestedRole === 'SUPER_ADMIN') {
      if (superAdminExists) {
        return res.status(409).json({
          success: false,
          message: 'Super Admin already exists. Register as Manager or Sales Employee.',
        });
      }
    } else if (!['MANAGER', 'SALES_EMPLOYEE'].includes(requestedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
      assertSubscriptionActive(existingCompany);
    } catch (err) {
      return res.status(err.statusCode || 403).json({
        success: false,
        message: err.message,
        code: err.code,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { companyId_email: { companyId: existingCompany.id, email: emailLower } },
    });

    if (!existingUser) {
      return res.status(403).json({
        success: false,
        message: 'Your employee profile is not imported for this workspace. Contact your admin.',
      });
    }

    return res.status(409).json({
      success: false,
      message: 'Email already registered. Please sign in.',
    });
  }

  if (!companyName) {
    return res.status(400).json({
      success: false,
      message: 'Company / workspace name is required',
    });
  }

  const selectedPlan = plan && getPlan(plan) ? plan : 'STARTER';
  const company = await createCompany({
    name: companyName,
    plan: selectedPlan,
    contactEmail: emailLower,
    contactPhone: phone || null,
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name,
      email: emailLower,
      phone: phone || null,
      passwordHash,
      role: 'SUPER_ADMIN',
      department: 'Management',
      status: 'ACTIVE',
    },
    include: { company: true },
  });

  if (company.subscriptionStatus !== 'ACTIVE') {
    const paymentToken = signPaymentToken({
      companyId: company.id,
      email: emailLower,
      plan: company.plan,
    });
    return res.status(201).json({
      success: true,
      message: 'Account created. Complete payment to start using the CRM.',
      data: {
        needsPayment: true,
        paymentToken,
        plan: company.plan,
        planDetails: getPlan(company.plan),
        companyId: company.id,
        user: toSafeUser(user),
      },
    });
  }

  const token = issueToken(user);
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { token, user: toSafeUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, companyName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const emailLower = email.toLowerCase();
  const { user, message } = await resolveLoginUser(emailLower, companyName);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ success: false, message: message || 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.company.subscriptionStatus !== 'ACTIVE') {
    const paymentToken = signPaymentToken({
      companyId: user.companyId,
      email: user.email,
      plan: user.company.plan,
    });
    return res.status(403).json({
      success: false,
      message: 'Please complete your plan payment to access the CRM',
      code: 'PAYMENT_REQUIRED',
      data: {
        needsPayment: true,
        paymentToken,
        plan: user.company.plan,
        planDetails: getPlan(user.company.plan),
        companyId: user.companyId,
      },
    });
  }

  if (user.company.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, message: 'Company account is suspended' });
  }

  const token = issueToken(user);
  res.json({ success: true, data: { token, user: toSafeUser(user) } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: toSafeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const data = {};
  if (name != null && String(name).trim()) data.name = String(name).trim();
  if (phone !== undefined) data.phone = phone || null;

  if (newPassword) {
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Social login accounts cannot set password here',
      });
    }
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (!Object.keys(data).length) {
    return res.status(400).json({ success: false, message: 'No changes provided' });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: userSelectWithCompany(),
  });

  res.json({ success: true, message: 'Profile updated', data: toSafeUser(updated) });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export const oauthProviders = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: listOAuthProviders() });
});

export const oauthStart = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const url = getOAuthStartUrl(req, provider);
  res.redirect(url);
});

export const oauthCallback = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(oauthErrorRedirect(String(error)));
  }

  try {
    const { token } = await handleOAuthCallback(req, provider, { code, state });
    return res.redirect(oauthSuccessRedirect(token));
  } catch (err) {
    return res.redirect(oauthErrorRedirect(err.message || 'OAuth login failed'));
  }
});
