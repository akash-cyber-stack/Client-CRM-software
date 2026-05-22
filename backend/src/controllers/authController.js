import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasSuperAdmin } from '../services/superAdminService.js';

export const setupStatus = asyncHandler(async (req, res) => {
  const superAdminExists = await hasSuperAdmin();
  res.json({
    success: true,
    data: {
      hasSuperAdmin: superAdminExists,
      canRegisterSuperAdmin: !superAdminExists,
    },
  });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const requestedRole = role || 'SALES_EMPLOYEE';
  const superAdminExists = await hasSuperAdmin();

  if (requestedRole === 'SUPER_ADMIN') {
    if (superAdminExists) {
      return res.status(409).json({
        success: false,
        message: 'Super Admin already exists. Only one Super Admin is allowed. Register as Manager or Sales Employee.',
      });
    }
  } else if (!['MANAGER', 'SALES_EMPLOYEE'].includes(requestedRole)) {
    return res.status(400).json({ success: false, message: 'Invalid role for registration' });
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) {
    return res.status(409).json({ success: false, message: 'Email already registered. Please sign in.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      passwordHash,
      role: requestedRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : requestedRole,
      department: requestedRole === 'SUPER_ADMIN' ? 'Management' : 'Sales',
      status: 'ACTIVE',
    },
  });

  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({
    success: true,
    message:
      user.role === 'SUPER_ADMIN'
        ? 'Super Admin account created successfully'
        : 'Registration successful',
    data: { token, user: safeUser },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: { token, user: safeUser } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});
