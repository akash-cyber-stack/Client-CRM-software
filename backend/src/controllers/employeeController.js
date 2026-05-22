import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  department: true,
  ivrAgentId: true,
  ivrExtension: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { assignedLeads: true, callLogs: true } },
};

export const listEmployees = asyncHandler(async (req, res) => {
  const { status, role, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const employees = await prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: employees });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, department, ivrAgentId, ivrExtension, status } = req.body;

  if (role === 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Super Admin cannot be created here. Use Settings → Add Super Admin.',
    });
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

  const passwordHash = await bcrypt.hash(password || 'Password@123', 10);
  const employee = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: role || 'SALES_EMPLOYEE',
      department,
      ivrAgentId,
      ivrExtension,
      status: status || 'ACTIVE',
    },
    select: userSelect,
  });
  res.status(201).json({ success: true, data: employee });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password, role, department, ivrAgentId, ivrExtension, status } = req.body;

  if (role === 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Use Settings → Add Super Admin to assign Super Admin role.',
    });
  }

  const data = { name, phone, role, department, ivrAgentId, ivrExtension, status };
  if (email) data.email = email.toLowerCase();
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const employee = await prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
  res.json({ success: true, data: employee });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }
  await prisma.user.delete({ where: { id } });
  res.json({ success: true, message: 'Employee deleted' });
});
