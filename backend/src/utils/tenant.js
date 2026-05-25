/** Attach company scope to Prisma where clauses */
export function withCompany(companyId, where = {}) {
  if (!companyId) {
    throw Object.assign(new Error('Company context required'), { statusCode: 403 });
  }
  return { ...where, companyId };
}

export function userSelectWithCompany() {
  return {
    id: true,
    companyId: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    department: true,
    ivrAgentId: true,
    ivrExtension: true,
    status: true,
    createdAt: true,
    company: {
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        paidAt: true,
        status: true,
      },
    },
  };
}

export function toSafeUser(user) {
  if (!user) return null;
  const { passwordHash, oauthProvider, oauthSubject, company, ...rest } = user;
  return {
    ...rest,
    companyName: company?.name,
    plan: company?.plan,
    subscriptionStatus: company?.subscriptionStatus,
    company,
  };
}
