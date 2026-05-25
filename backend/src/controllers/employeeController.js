import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { MAX_IMPORT_EMPLOYEES } from '../constants/limits.js';
import { checkUserSeatAvailability, countCompanyUsers, getCompanyPlan } from '../services/planEnforcementService.js';
import { getPlanLimits, planLimitMessage } from '../constants/planLimits.js';

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

function sanitizeRole(role) {
  return role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : role || 'SALES_EMPLOYEE';
}

function sanitizeStatus(status) {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
}

export const listEmployees = asyncHandler(async (req, res) => {
  const { status, role, search } = req.query;
  const where = { companyId: req.companyId };
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

  const plan = await getCompanyPlan(req.companyId);
  const used = await countCompanyUsers(req.companyId);
  const limits = getPlanLimits(plan);

  res.json({
    success: true,
    data: employees,
    seats: {
      used,
      max: limits.maxUsers,
      remaining: limits.maxUsers == null ? null : Math.max(0, limits.maxUsers - used),
      plan,
    },
  });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, department, ivrAgentId, ivrExtension, status } = req.body;

  if (role === 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Super Admin cannot be created here. Use Settings → Add Super Admin.',
    });
  }

  const exists = await prisma.user.findUnique({
    where: { companyId_email: { companyId: req.companyId, email: email.toLowerCase() } },
  });
  if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

  const plan = req.user.company?.plan || 'STARTER';
  const seats = await checkUserSeatAvailability(req.companyId, plan, 1);
  if (!seats.ok) {
    return res.status(403).json({
      success: false,
      message: planLimitMessage(plan, 'users') || 'User limit reached for your plan',
    });
  }

  const passwordHash = await bcrypt.hash(password || 'Password@123', 10);
  const employee = await prisma.user.create({
    data: {
      companyId: req.companyId,
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: sanitizeRole(role),
      department,
      ivrAgentId,
      ivrExtension,
      status: sanitizeStatus(status),
    },
    select: userSelect,
  });
  res.status(201).json({ success: true, data: employee });
});

export const importEmployees = asyncHandler(async (req, res) => {
  const { employees = [] } = req.body;

  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ success: false, message: 'employees array is required' });
  }

  if (employees.length > MAX_IMPORT_EMPLOYEES) {
    return res.status(400).json({
      success: false,
      message: `Import at most ${MAX_IMPORT_EMPLOYEES} employees per file`,
    });
  }

  const normalizedEmployees = employees.map((employee) => ({
    name: String(employee.name || '').trim(),
    email: String(employee.email || '').trim().toLowerCase(),
    phone: employee.phone ? String(employee.phone).trim() : null,
    password: String(employee.password || '').trim(),
    role: sanitizeRole(employee.role),
    department: employee.department ? String(employee.department).trim() : 'Sales',
    ivrAgentId: employee.ivrAgentId ? String(employee.ivrAgentId).trim() : null,
    ivrExtension: employee.ivrExtension ? String(employee.ivrExtension).trim() : null,
    status: sanitizeStatus(employee.status),
  }));

  const invalidRows = normalizedEmployees.filter((employee) => {
    if (!employee.name || !employee.email || !employee.password) return true;
    if (employee.role === 'SUPER_ADMIN') return true;
    return false;
  });

  if (invalidRows.length) {
    return res.status(400).json({
      success: false,
      message: 'Each employee must include name, email, and password. Super Admin cannot be imported.',
    });
  }

  const existingEmployees = await prisma.user.findMany({
    where: {
      companyId: req.companyId,
      email: { in: normalizedEmployees.map((employee) => employee.email) },
    },
    select: { email: true },
  });

  const existingEmails = new Set(existingEmployees.map((employee) => employee.email));
  let rowsToCreate = [];

  for (const employee of normalizedEmployees) {
    if (!existingEmails.has(employee.email)) {
      rowsToCreate.push(employee);
    }
  }

  const plan = req.user.company?.plan || 'STARTER';
  const seats = await checkUserSeatAvailability(req.companyId, plan, 0);
  const duplicateEmailCount = normalizedEmployees.length - rowsToCreate.length;
  let skippedDueToPlanLimit = 0;

  if (seats.max != null && rowsToCreate.length > seats.remaining) {
    skippedDueToPlanLimit = rowsToCreate.length - seats.remaining;
    rowsToCreate = rowsToCreate.slice(0, seats.remaining);
  }

  if (rowsToCreate.length === 0 && skippedDueToPlanLimit > 0) {
    return res.status(403).json({
      success: false,
      message: planLimitMessage(plan, 'users') || 'User limit reached for your plan',
      data: {
        createdCount: 0,
        duplicateCount: normalizedEmployees.length,
        skippedDueToPlanLimit,
      },
    });
  }

  const BATCH = 25;
  for (let i = 0; i < rowsToCreate.length; i += BATCH) {
    const slice = rowsToCreate.slice(i, i + BATCH);
    await prisma.$transaction(
      slice.map((employee) =>
        prisma.user.create({
          data: {
            companyId: req.companyId,
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            passwordHash: bcrypt.hashSync(employee.password, 10),
            role: employee.role,
            department: employee.department,
            ivrAgentId: employee.ivrAgentId,
            ivrExtension: employee.ivrExtension,
            status: employee.status,
          },
        })
      )
    );
  }

  res.status(201).json({
    success: true,
    data: {
      createdCount: rowsToCreate.length,
      duplicateCount: duplicateEmailCount,
      skippedDueToPlanLimit,
      seatsUsed: seats.current + rowsToCreate.length,
      seatsMax: seats.max,
    },
  });
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

  const existing = await prisma.user.findFirst({ where: { id, companyId: req.companyId } });
  if (!existing) return res.status(404).json({ success: false, message: 'Employee not found' });

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
  const existing = await prisma.user.findFirst({ where: { id, companyId: req.companyId } });
  if (!existing) return res.status(404).json({ success: false, message: 'Employee not found' });
  await prisma.user.delete({ where: { id } });
  res.json({ success: true, message: 'Employee deleted' });
});
