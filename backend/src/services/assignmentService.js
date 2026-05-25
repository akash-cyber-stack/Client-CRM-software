import prisma from '../config/db.js';
import { getAssignmentMethod } from './settingsService.js';
import { createNotification, notifyOnLeadAssignment } from './notificationService.js';
import { logActivity } from './leadActivityService.js';

async function getActiveSalesEmployees(companyId) {
  return prisma.user.findMany({
    where: {
      companyId,
      role: 'SALES_EMPLOYEE',
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function assignLeadRoundRobin(leadId, companyId) {
  const employees = await getActiveSalesEmployees(companyId);
  if (!employees.length) return null;

  let state = await prisma.leadAssignmentState.findUnique({ where: { companyId } });
  if (!state) {
    state = await prisma.leadAssignmentState.create({ data: { companyId } });
  }

  let startIndex = 0;
  if (state.lastEmployeeId) {
    const lastIdx = employees.findIndex((e) => e.id === state.lastEmployeeId);
    startIndex = lastIdx >= 0 ? (lastIdx + 1) % employees.length : 0;
  }

  const employee = employees[startIndex];

  await prisma.leadAssignmentState.update({
    where: { companyId },
    data: { lastEmployeeId: employee.id },
  });

  const lead = await prisma.lead.update({
    where: { id: leadId, companyId },
    data: {
      assignedToId: employee.id,
      status: 'ASSIGNED',
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  await logActivity(leadId, 'LEAD_ASSIGNED', `Lead assigned to ${employee.name} (round-robin)`, {
    employeeId: employee.id,
    method: 'ROUND_ROBIN',
  });

  await createNotification({
    userId: employee.id,
    type: 'LEAD_ASSIGNED',
    title: 'New lead assigned',
    message: `Lead ${lead.customerName} (${lead.phone}) has been assigned to you.`,
    leadId,
  });

  return lead;
}

export async function autoAssignLead(leadId, companyId) {
  const method = await getAssignmentMethod(companyId);
  if (method === 'MANUAL') return null;
  return assignLeadRoundRobin(leadId, companyId);
}

export async function manualAssignLead(leadId, employeeId, companyId, { assignedBy } = {}) {
  const employee = await prisma.user.findFirst({
    where: {
      id: employeeId,
      companyId,
      role: { in: ['SALES_EMPLOYEE', 'MANAGER'] },
      status: 'ACTIVE',
    },
  });
  if (!employee) throw Object.assign(new Error('Employee not found or inactive'), { statusCode: 404 });

  const lead = await prisma.lead.update({
    where: { id: leadId, companyId },
    data: { assignedToId: employeeId, status: 'ASSIGNED' },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  await logActivity(leadId, 'LEAD_ASSIGNED', `Lead manually assigned to ${employee.name}`, {
    employeeId,
    method: 'MANUAL',
  });

  await notifyOnLeadAssignment({
    lead,
    assigneeId: employeeId,
    assignedBy: assignedBy
      ? { id: assignedBy.id, name: assignedBy.name, role: assignedBy.role }
      : null,
  });

  return lead;
}
