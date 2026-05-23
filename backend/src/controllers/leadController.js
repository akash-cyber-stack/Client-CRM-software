import prisma from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildLeadWhere, findLeadByPhoneOrEmail } from '../services/leadService.js';
import { manualAssignLead } from '../services/assignmentService.js';
import { logActivity, getLeadTimeline } from '../services/leadActivityService.js';
import { isValidPhone } from '../utils/phone.js';

export const listLeads = asyncHandler(async (req, res) => {
  const where = buildLeadWhere(req.query, req.employeeScopeId);
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  res.json({ success: true, data: leads, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, phone: true } },
      notes: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      followUps: { orderBy: { scheduledAt: 'desc' }, take: 20 },
      callLogs: {
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { callStartTime: 'desc' },
      },
    },
  });

  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  if (req.employeeScopeId && lead.assignedToId !== req.employeeScopeId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const timeline = await getLeadTimeline(id);
  const payload = { ...lead, timeline };
  if (req.employeeScopeId) {
    delete payload.callLogs;
  }
  res.json({ success: true, data: payload });
});

const SALES_EDITABLE_LEAD_FIELDS = [
  'customerName', 'phone', 'email', 'city', 'requirement', 'remarks',
  'status', 'followUpDate',
];

export const createLead = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!isValidPhone(body.phone)) {
    return res.status(400).json({ success: false, message: 'Valid phone number required' });
  }

  const existing = await findLeadByPhoneOrEmail(body.phone, body.email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Lead with this phone already exists', data: existing });
  }

  const lead = await prisma.lead.create({
    data: {
      customerName: body.customerName,
      phone: body.phone,
      email: body.email,
      city: body.city,
      requirement: body.requirement,
      source: body.source || 'MANUAL',
      campaignName: body.campaignName,
      adSetName: body.adSetName,
      adName: body.adName,
      formName: body.formName,
      status: body.assignedToId ? 'ASSIGNED' : 'NEW',
      assignedToId: body.assignedToId || null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      remarks: body.remarks,
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  await logActivity(lead.id, 'LEAD_CREATED', 'Manual lead created');
  if (body.assignedToId) {
    await logActivity(lead.id, 'LEAD_ASSIGNED', 'Lead assigned on creation');
  } else if (req.body.autoAssign !== false) {
    try {
      const { autoAssignLead } = await import('../services/assignmentService.js');
      await autoAssignLead(lead.id);
    } catch (assignErr) {
      console.warn('[createLead] auto-assign skipped:', assignErr.message);
    }
  }

  const updated = await prisma.lead.findUnique({
    where: { id: lead.id },
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  res.status(201).json({ success: true, data: updated });
});

export const updateLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ success: false, message: 'Lead not found' });
  if (req.employeeScopeId && existing.assignedToId !== req.employeeScopeId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { status, followUpDate } = req.body;
  const data = {};
  if (req.employeeScopeId) {
    for (const key of SALES_EDITABLE_LEAD_FIELDS) {
      if (req.body[key] === undefined) continue;
      if (key === 'followUpDate') {
        data.followUpDate = req.body.followUpDate ? new Date(req.body.followUpDate) : null;
      } else {
        data[key] = req.body[key];
      }
    }
  } else {
    const { status: bodyStatus, followUpDate: bodyFollowUp, ...rest } = req.body;
    Object.assign(data, rest);
    if (bodyFollowUp !== undefined) data.followUpDate = bodyFollowUp ? new Date(bodyFollowUp) : null;
    if (bodyStatus) data.status = bodyStatus;
  }

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  if (status && status !== existing.status) {
    await logActivity(id, 'STATUS_CHANGED', `Status changed from ${existing.status} to ${status}`);
  }

  res.json({ success: true, data: lead });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.lead.delete({ where: { id } });
  res.json({ success: true, message: 'Lead deleted' });
});

export const assignLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId required' });
  const lead = await manualAssignLead(id, employeeId);
  res.json({ success: true, data: lead });
});

export const addNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Note content required' });

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  if (req.employeeScopeId && lead.assignedToId !== req.employeeScopeId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const note = await prisma.note.create({
    data: { leadId: id, authorId: req.user.id, content },
    include: { author: { select: { id: true, name: true } } },
  });
  await logActivity(id, 'NOTE_ADDED', `Note added by ${req.user.name}`);
  res.status(201).json({ success: true, data: note });
});

export const addFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, remarks, employeeId } = req.body;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  if (req.employeeScopeId && lead.assignedToId !== req.employeeScopeId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const empId = req.employeeScopeId || employeeId || lead.assignedToId || req.user.id;
  const followUp = await prisma.followUp.create({
    data: {
      leadId: id,
      employeeId: empId,
      scheduledAt: new Date(scheduledAt),
      remarks,
    },
    include: { employee: { select: { id: true, name: true } }, lead: { select: { id: true, customerName: true } } },
  });

  await prisma.lead.update({
    where: { id },
    data: { followUpDate: new Date(scheduledAt), status: 'FOLLOW_UP' },
  });
  await logActivity(id, 'FOLLOW_UP_SET', `Follow-up scheduled for ${scheduledAt}`);
  res.status(201).json({ success: true, data: followUp });
});
