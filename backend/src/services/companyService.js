import { randomUUID } from 'crypto';
import prisma from '../config/db.js';

const DEFAULT_SETTINGS = {
  google_webhook_secret: '',
  meta_webhook_token: '',
  meta_webhook_secret: '',
  ivr_api_key: '',
  ivr_api_url: '',
  ivr_webhook_secret: '',
  lead_assignment_method: 'ROUND_ROBIN',
  api_base_url: 'http://localhost:5000',
  automation_missed_followup: 'true',
  automation_followup_reminder: 'true',
  automation_stale_lead_enabled: 'true',
  automation_stale_lead_days: '3',
  automation_unassigned_lead_alert: 'true',
  automation_auto_assign_webhook: 'true',
};

function internalGstin() {
  return `CRM-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

async function seedCompanyDefaults(companyId) {
  await prisma.leadAssignmentState.upsert({
    where: { companyId },
    update: {},
    create: { companyId },
  });

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { companyId_key: { companyId, key } },
      update: {},
      create: { companyId, key, value },
    });
  }
}

export async function getCompanyById(id) {
  return prisma.company.findUnique({ where: { id } });
}

export async function getDefaultCompany() {
  return prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
}

export async function createCompany({ name, plan = 'STARTER', contactEmail, contactPhone }) {
  const company = await prisma.company.create({
    data: {
      name: String(name).trim(),
      gstin: internalGstin(),
      plan,
      subscriptionStatus: 'PENDING',
      contactEmail: contactEmail ? String(contactEmail).toLowerCase() : null,
      contactPhone: contactPhone || null,
      status: 'ACTIVE',
    },
  });

  await seedCompanyDefaults(company.id);
  return company;
}

export async function getCompanyProfile(companyId) {
  return prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      paidAt: true,
      paymentId: true,
      contactPhone: true,
      contactEmail: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateCompanyProfile(companyId, data) {
  const { name, contactPhone, contactEmail } = data;
  const payload = {};
  if (name != null && String(name).trim()) payload.name = String(name).trim();
  if (contactPhone !== undefined) payload.contactPhone = contactPhone || null;
  if (contactEmail !== undefined) {
    payload.contactEmail = contactEmail ? String(contactEmail).toLowerCase() : null;
  }

  if (!Object.keys(payload).length) {
    throw Object.assign(new Error('No valid fields to update'), { statusCode: 400 });
  }

  return prisma.company.update({
    where: { id: companyId },
    data: payload,
    select: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      paidAt: true,
      contactPhone: true,
      contactEmail: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function hasSuperAdminGlobally() {
  const count = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
  return count > 0;
}

export async function hasSuperAdminInCompany(companyId) {
  const count = await prisma.user.count({
    where: { companyId, role: 'SUPER_ADMIN' },
  });
  return count > 0;
}

export function assertSubscriptionActive(company) {
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 });
  }
  if (company.status !== 'ACTIVE') {
    throw Object.assign(new Error('Company account is suspended'), { statusCode: 403 });
  }
  if (company.subscriptionStatus !== 'ACTIVE') {
    throw Object.assign(new Error('Please complete your plan payment to use the CRM'), {
      statusCode: 403,
      code: 'PAYMENT_REQUIRED',
      plan: company.plan,
      companyId: company.id,
    });
  }
}
