import prisma from '../config/db.js';
import { normalizePhone } from '../utils/phone.js';
import { logActivity } from './leadActivityService.js';
import { createNotification } from './notificationService.js';

const CALL_TYPE_MAP = {
  incoming: 'INCOMING',
  outgoing: 'OUTGOING',
  missed: 'MISSED',
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING',
  MISSED: 'MISSED',
};

const CALL_STATUS_MAP = {
  answered: 'ANSWERED',
  missed: 'MISSED',
  failed: 'FAILED',
  busy: 'BUSY',
  ANSWERED: 'ANSWERED',
  MISSED: 'MISSED',
  FAILED: 'FAILED',
  BUSY: 'BUSY',
};

export async function processIvrCallCompleted(payload) {
  const {
    call_id: externalCallId,
    ivr_provider_call_id: ivrProviderCallId,
    ivr_agent_id: ivrAgentId,
    customer_phone: customerPhone,
    employee_id: employeeIdFromPayload,
    call_type: callTypeRaw,
    call_status: callStatusRaw,
    call_start_time: callStartTime,
    call_end_time: callEndTime,
    call_duration: durationSeconds,
    recording_url: recordingUrl,
    notes,
    lead_id: leadIdFromPayload,
  } = payload;

  const phone = customerPhone;
  const normalized = normalizePhone(phone);

  // Match employee by IVR Agent ID first, then explicit employee_id
  let employee = null;
  if (ivrAgentId) {
    employee = await prisma.user.findFirst({
      where: { ivrAgentId: String(ivrAgentId), status: 'ACTIVE' },
    });
  }
  if (!employee && employeeIdFromPayload) {
    employee = await prisma.user.findUnique({ where: { id: employeeIdFromPayload } });
  }

  // Match lead by phone
  let lead = null;
  if (leadIdFromPayload) {
    lead = await prisma.lead.findUnique({ where: { id: leadIdFromPayload } });
  }
  if (!lead && normalized) {
    const leads = await prisma.lead.findMany();
    lead = leads.find((l) => normalizePhone(l.phone) === normalized) || null;
  }

  const isLinked = !!(lead && employee);
  const callType = CALL_TYPE_MAP[callTypeRaw] || 'OUTGOING';
  const callStatus = CALL_STATUS_MAP[callStatusRaw] || 'ANSWERED';
  const start = callStartTime ? new Date(callStartTime) : new Date();
  const end = callEndTime ? new Date(callEndTime) : null;
  const duration = parseInt(durationSeconds, 10) || (end && start ? Math.floor((end - start) / 1000) : 0);

  const callLog = await prisma.callLog.create({
    data: {
      leadId: lead?.id || null,
      employeeId: employee?.id || null,
      customerPhone: phone,
      ivrAgentId: ivrAgentId ? String(ivrAgentId) : null,
      callType,
      callStatus,
      callStartTime: start,
      callEndTime: end,
      durationSeconds: duration,
      recordingUrl: recordingUrl || null,
      ivrProviderCallId: ivrProviderCallId || externalCallId || null,
      notes,
      isLinked,
    },
    include: {
      lead: { select: { id: true, customerName: true, source: true, leadNumber: true } },
      employee: { select: { id: true, name: true } },
    },
  });

  if (lead) {
    await logActivity(lead.id, 'CALL_MADE', `Call ${callStatus} - ${duration}s`, {
      callId: callLog.id,
      recordingUrl,
    });
    if (lead.status === 'NEW' || lead.status === 'ASSIGNED') {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'CONTACTED' },
      });
      await logActivity(lead.id, 'STATUS_CHANGED', 'Status updated to CONTACTED after call');
    }
  }

  if (employee && recordingUrl) {
    await createNotification({
      userId: employee.id,
      type: 'CALL_RECORDING',
      title: 'Call recording saved',
      message: lead
        ? `Recording saved for lead ${lead.customerName}`
        : `Recording saved for call to ${phone}`,
      leadId: lead?.id,
      callId: callLog.id,
    });
  }

  return callLog;
}
