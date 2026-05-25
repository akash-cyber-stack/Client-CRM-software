import prisma from '../config/db.js';

export async function hasSuperAdmin(companyId) {
  const count = await prisma.user.count({ where: { companyId, role: 'SUPER_ADMIN' } });
  return count > 0;
}

export async function getSuperAdmin(companyId) {
  return prisma.user.findFirst({
    where: { companyId, role: 'SUPER_ADMIN' },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

/** Only one Super Admin per company — replaces current by demoting to MANAGER */
export async function assignSuperAdmin(companyId, { userId, email, name, phone, password }) {
  const existing = await getSuperAdmin(companyId);

  if (userId) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (user.role === 'SUPER_ADMIN') {
      throw Object.assign(new Error('This user is already Super Admin'), { statusCode: 400 });
    }

    if (existing && existing.id !== userId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'MANAGER' },
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  if (!email || !name || !password) {
    throw Object.assign(new Error('Email, name, and password required for new Super Admin'), { statusCode: 400 });
  }

  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash(password, 10);

  const dup = await prisma.user.findUnique({
    where: { companyId_email: { companyId, email: email.toLowerCase() } },
  });
  if (dup) {
    throw Object.assign(new Error('Email already registered. Promote existing user instead.'), { statusCode: 409 });
  }

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'MANAGER' },
    });
  }

  return prisma.user.create({
    data: {
      companyId,
      email: email.toLowerCase(),
      name,
      phone,
      passwordHash,
      role: 'SUPER_ADMIN',
      department: 'Management',
      status: 'ACTIVE',
    },
    select: { id: true, name: true, email: true, role: true },
  });
}
