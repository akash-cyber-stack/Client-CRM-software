import prisma from '../config/db.js';
import { getAssignmentMethod } from './settingsService.js';
import { createNotification, notifyOnLeadAssignment } from './notificationService.js';
import { logActivity } from './leadActivityService.js';

/** Get active sales employees for round-robin */
async function getActiveSalesEmployees() {
  return prisma.user.findMany({
    where: {
      role: 'SALES_EMPLOYEE',
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'asc' },
  });
}

/** Round-robin: assign next active employee, skip inactive */
export async function assignLeadRoundRobin(leadId) {
  const employees = await getActiveSalesEmployees();
  if (!employees.length) return null;

  let state = await prisma.leadAssignmentState.findUnique({ where: { id: 'default' } });
  if (!state) {
    state = await prisma.leadAssignmentState.create({ data: { id: 'default' } });
  }

  let startIndex = 0;
  if (state.lastEmployeeId) {
    const lastIdx = employees.findIndex((e) => e.id === state.lastEmployeeId);
    startIndex = lastIdx >= 0 ? (lastIdx + 1) % employees.length : 0;
  }

  const employee = employees[startIndex];

  await prisma.leadAssignmentState.update({
    where: { id: 'default' },
    data: { lastEmployeeId: employee.id },
  });

  const lead = await prisma.lead.update({
    where: { id: leadId },
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

export async function autoAssignLead(leadId) {
  const method = await getAssignmentMethod();
  if (method === 'MANUAL') return null;
  return assignLeadRoundRobin(leadId);
}

export async function manualAssignLead(leadId, employeeId, { assignedBy } = {}) {
  const employee = await prisma.user.findFirst({
    where: { id: employeeId, role: { in: ['SALES_EMPLOYEE', 'MANAGER'] }, status: 'ACTIVE' },
  });
  if (!employee) throw Object.assign(new Error('Employee not found or inactive'), { statusCode: 404 });

  const lead = await prisma.lead.update({
    where: { id: leadId },
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
