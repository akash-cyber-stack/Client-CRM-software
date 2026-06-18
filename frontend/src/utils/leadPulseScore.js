const STATUS_WEIGHT = {
  NEW: 55,
  ASSIGNED: 58,
  CONTACTED: 65,
  INTERESTED: 78,
  FOLLOW_UP: 88,
  CONVERTED: 100,
  NOT_INTERESTED: 20,
  LOST: 12,
};

/** Client-side lead priority — unique "Pulse" score 0–100 */
export function computeLeadPulse(lead) {
  if (!lead) return { score: 0, tier: 'cold', label: 'Cold', color: '#64748b' };

  let score = STATUS_WEIGHT[lead.status] ?? 50;

  if (lead.followUpDate) {
    const due = new Date(lead.followUpDate).getTime();
    const now = Date.now();
    const hours = (due - now) / (1000 * 60 * 60);
    if (hours < 0) score += 15;
    else if (hours < 24) score += 10;
    else if (hours < 72) score += 4;
  }

  if (lead.source === 'GOOGLE_ADS' || lead.source === 'META_ADS') score += 5;
  if (!lead.assignedToId) score += 8;

  const ageDays = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 7 && lead.status === 'NEW') score += 12;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier = 'warm';
  let label = 'Warm';
  let color = '#c9a227';
  if (score >= 80) {
    tier = 'hot';
    label = 'Hot';
    color = '#ef4444';
  } else if (score < 45) {
    tier = 'cold';
    label = 'Cold';
    color = '#3b82f6';
  }

  return { score, tier, label, color };
}
