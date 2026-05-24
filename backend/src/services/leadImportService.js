import prisma from '../config/db.js';
import { normalizePhone, isValidPhone } from '../utils/phone.js';
import { logActivity } from './leadActivityService.js';
import { createNotification } from './notificationService.js';

const ADMIN_ASSIGN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const VALID_STATUSES = new Set([
  'NEW', 'ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP',
  'CONVERTED', 'NOT_INTERESTED', 'LOST',
]);

/** Bulk file import — always manual entry (no Google/Meta from spreadsheet). */
function parseImportSource() {
  return 'MANUAL';
}

function parseStatus(value, hasAssignee) {
  const raw = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (VALID_STATUSES.has(raw)) return raw;
  return hasAssignee ? 'ASSIGNED' : 'NEW';
}

async function loadExistingPhones() {
  const leads = await prisma.lead.findMany({ select: { phone: true } });
  return new Set(leads.map((l) => normalizePhone(l.phone)).filter(Boolean));
}

async function getActiveSalesEmployees() {
  return prisma.user.findMany({
    where: { role: 'SALES_EMPLOYEE', status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
}

function resolveAssignee(row, { assignmentMode, assignToEmployeeId, employees, rrState }) {
  if (assignmentMode === 'ASSIGN_TO' && assignToEmployeeId) {
    return assignToEmployeeId;
  }
  if (assignmentMode === 'ROUND_ROBIN' && employees.length) {
    const emp = employees[rrState.index % employees.length];
    rrState.index += 1;
    return emp.id;
  }
  return null;
}

/**
 * @param {object} params
 * @param {Array} params.rows - parsed lead rows from client
 * @param {'ROUND_ROBIN'|'ASSIGN_TO'} params.assignmentMode
 * @param {string} [params.assignToEmployeeId]
 */
export async function importLeadsBulk({ rows, assignmentMode, assignToEmployeeId, assignedBy }) {
  const totalRows = rows.length;
  const failed = [];
  const duplicates = [];
  const toCreate = [];
  const seenPhones = new Set();
  const existingPhones = await loadExistingPhones();

  if (assignmentMode === 'ASSIGN_TO') {
    if (!assignToEmployeeId) {
      throw Object.assign(new Error('assignToEmployeeId required when assignmentMode is ASSIGN_TO'), { statusCode: 400 });
    }
    const emp = await prisma.user.findFirst({
      where: { id: assignToEmployeeId, role: 'SALES_EMPLOYEE', status: 'ACTIVE' },
    });
    if (!emp) {
      throw Object.assign(new Error('Selected employee not found or inactive'), { statusCode: 400 });
    }
  }

  const employees = assignmentMode === 'ROUND_ROBIN' ? await getActiveSalesEmployees() : [];
  if (assignmentMode === 'ROUND_ROBIN' && !employees.length) {
    throw Object.assign(new Error('No active sales employees for round-robin assignment'), { statusCode: 400 });
  }

  const rrState = { index: 0 };
  if (assignmentMode === 'ROUND_ROBIN') {
    const state = await prisma.leadAssignmentState.findUnique({ where: { id: 'default' } });
    if (state?.lastEmployeeId) {
      const idx = employees.findIndex((e) => e.id === state.lastEmployeeId);
      rrState.index = idx >= 0 ? idx + 1 : 0;
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNumber = raw.rowNumber ?? i + 2;
    const customerName = String(raw.customerName || '').trim();
    const phoneRaw = String(raw.phone || '').trim();
    const normalized = normalizePhone(phoneRaw);

    if (!phoneRaw) {
      failed.push({ rowNumber, row: raw, reason: 'Phone number is required' });
      continue;
    }
    if (!isValidPhone(phoneRaw)) {
      failed.push({ rowNumber, row: raw, reason: 'Invalid phone number (min 10 digits)' });
      continue;
    }
    if (!customerName) {
      failed.push({ rowNumber, row: raw, reason: 'Customer name is required' });
      continue;
    }
    if (seenPhones.has(normalized)) {
      duplicates.push({ rowNumber, row: raw, reason: 'Duplicate phone in file' });
      continue;
    }
    if (existingPhones.has(normalized)) {
      duplicates.push({ rowNumber, row: raw, reason: 'Lead with this phone already exists' });
      continue;
    }

    seenPhones.add(normalized);
    existingPhones.add(normalized);

    const assignedToId = resolveAssignee(raw, { assignmentMode, assignToEmployeeId, employees, rrState });
    if (!assignedToId) {
      failed.push({ rowNumber, row: raw, reason: 'Could not assign employee' });
      continue;
    }

    toCreate.push({
      customerName,
      phone: phoneRaw,
      email: raw.email ? String(raw.email).trim() : null,
      city: raw.city ? String(raw.city).trim() : null,
      requirement: raw.requirement ? String(raw.requirement).trim() : null,
      source: parseImportSource(),
      campaignName: raw.campaignName ? String(raw.campaignName).trim() : null,
      status: parseStatus(raw.status, true),
      assignedToId,
      remarks: raw.notes ? String(raw.notes).trim() : null,
    });
  }

  let importedCount = 0;
  const CHUNK = 50;
  let lastAssignedId = null;
  const allCreated = [];

  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    const created = await prisma.lead.createManyAndReturn({ data: chunk });
    allCreated.push(...created);
    importedCount += created.length;
    lastAssignedId = chunk[chunk.length - 1]?.assignedToId || lastAssignedId;

    await Promise.all(
      created.map((lead) =>
        logActivity(lead.id, 'LEAD_CREATED', 'Lead imported via Excel/CSV', {
          source: lead.source,
          importBatch: true,
        })
      )
    );
  }

  if (allCreated.length) {
    const byAssignee = new Map();
    for (const lead of allCreated) {
      if (!lead.assignedToId) continue;
      byAssignee.set(lead.assignedToId, (byAssignee.get(lead.assignedToId) || 0) + 1);
    }

    await Promise.all(
      [...byAssignee.entries()].map(([userId, count]) =>
        createNotification({
          userId,
          type: 'LEAD_ASSIGNED',
          title: count === 1 ? 'New lead assigned' : `${count} new leads assigned`,
          message:
            count === 1
              ? 'A lead was imported and assigned to you.'
              : `${count} leads were imported and assigned to you.`,
        })
      )
    );

    if (assignedBy && ADMIN_ASSIGN_ROLES.includes(assignedBy.role)) {
      const managers = await prisma.user.findMany({
        where: { role: 'MANAGER', status: 'ACTIVE' },
        select: { id: true },
      });
      await Promise.all(
        managers.map((m) =>
          createNotification({
            userId: m.id,
            type: 'LEAD_ASSIGNED',
            title: 'Team leads assigned',
            message: `${assignedBy.name} imported ${importedCount} lead(s) and assigned them to your team.`,
          })
        )
      );
    }
  }

  if (assignmentMode === 'ROUND_ROBIN' && lastAssignedId) {
    await prisma.leadAssignmentState.upsert({
      where: { id: 'default' },
      create: { id: 'default', lastEmployeeId: lastAssignedId },
      update: { lastEmployeeId: lastAssignedId },
    });
  }

  return {
    totalRows,
    importedCount,
    duplicateCount: duplicates.length,
    failedCount: failed.length,
    duplicates,
    failed,
  };
}
