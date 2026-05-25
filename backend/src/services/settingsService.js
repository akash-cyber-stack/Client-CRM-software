import prisma from '../config/db.js';

const DEFAULTS = {
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

export async function getSetting(companyId, key) {
  const row = await prisma.setting.findUnique({
    where: { companyId_key: { companyId, key } },
  });
  return row?.value ?? DEFAULTS[key] ?? '';
}

export async function getAllSettings(companyId) {
  const rows = await prisma.setting.findMany({ where: { companyId } });
  const map = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function upsertSettings(companyId, data) {
  const entries = Object.entries(data);
  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { companyId_key: { companyId, key } },
      update: { value: String(value) },
      create: { companyId, key, value: String(value) },
    });
  }
  return getAllSettings(companyId);
}

export async function getAssignmentMethod(companyId) {
  const method = await getSetting(companyId, 'lead_assignment_method');
  return method === 'MANUAL' ? 'MANUAL' : 'ROUND_ROBIN';
}
