import prisma from '../config/db.js';
import { normalizePhone, isValidPhone } from '../utils/phone.js';
import { logActivity } from './leadActivityService.js';
import { autoAssignLead } from './assignmentService.js';
import { withCompany } from '../utils/tenant.js';

export async function findLeadByPhoneOrEmail(companyId, phone, email) {
  const normalized = normalizePhone(phone);
  const leads = await prisma.lead.findMany({
    where: withCompany(companyId, email
      ? { OR: [{ phone: { contains: normalized.slice(-10) } }, { email }] }
      : { phone: { contains: normalized.slice(-10) } }),
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  return leads.find((l) => normalizePhone(l.phone) === normalized || (email && l.email === email)) || null;
}

export async function upsertLeadFromWebhook({
  companyId,
  customerName,
  phone,
  email,
  city,
  requirement,
  source,
  campaignName,
  adSetName,
  adName,
  formName,
}) {
  if (!companyId) {
    throw Object.assign(new Error('Company context required for webhook'), { statusCode: 400 });
  }

  if (!isValidPhone(phone)) {
    throw Object.assign(new Error('Invalid phone number'), { statusCode: 400 });
  }

  const existing = await findLeadByPhoneOrEmail(companyId, phone, email);

  if (existing) {
    await logActivity(
      existing.id,
      'DUPLICATE_SOURCE',
      `Duplicate lead from ${source}: ${campaignName || 'N/A'}`,
      { source, campaignName, adSetName, adName, formName }
    );
    if (campaignName) {
      await logActivity(existing.id, 'CAMPAIGN_UPDATE', `Campaign: ${campaignName}`, {
        campaignName,
        adSetName,
        adName,
        formName,
      });
    }
    return { lead: existing, isDuplicate: true };
  }

  let campaignId = null;
  if (campaignName) {
    const campaign = await prisma.campaign.upsert({
      where: { companyId_name_source: { companyId, name: campaignName, source } },
      update: { adSetName, adName, formName },
      create: { companyId, name: campaignName, source, adSetName, adName, formName },
    });
    campaignId = campaign.id;
  }

  const lead = await prisma.lead.create({
    data: {
      companyId,
      customerName: customerName || 'Unknown',
      phone,
      email,
      city,
      requirement,
      source,
      campaignName,
      adSetName,
      adName,
      formName,
      campaignId,
      status: 'NEW',
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  await logActivity(lead.id, 'LEAD_CREATED', `Lead created from ${source}`, {
    source,
    campaignName,
  });

  const assigned = await autoAssignLead(lead.id, companyId);
  const updated = assigned || (await prisma.lead.findUnique({
    where: { id: lead.id },
    include: { assignedTo: { select: { id: true, name: true } } },
  }));

  return { lead: updated, isDuplicate: false };
}

export function buildLeadWhere(companyId, filters, employeeScopeId) {
  const where = withCompany(companyId, {});

  if (employeeScopeId) {
    where.assignedToId = employeeScopeId;
  } else if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;

  if (filters.search) {
    where.OR = [
      { customerName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
    if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
  }

  return where;
}
