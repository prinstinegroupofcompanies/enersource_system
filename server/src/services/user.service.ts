import { prisma } from '../lib/prisma.js';
import { hashPassword, validatePassword } from '../utils/password.js';
import { createAuditLog } from './audit.service.js';

export async function listUsers(filters?: { departmentId?: string; roleId?: string; search?: string }) {
  return prisma.user.findMany({
    where: {
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.roleId && { roleId: filters.roleId }),
      ...(filters?.search && {
        OR: [
          { email: { contains: filters.search } },
          { firstName: { contains: filters.search } },
          { lastName: { contains: filters.search } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      mfaEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      role: { select: { id: true, name: true, slug: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function createUser(
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string;
    departmentId?: string;
  },
  actorId: string
) {
  const validation = validatePassword(data.password);
  if (!validation.valid) throw new Error(validation.errors.join('. '));

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new Error('Email already registered');

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleId: data.roleId,
      departmentId: data.departmentId,
      mustChangePassword: true,
    },
    include: { role: true, department: true },
  });

  await createAuditLog({
    actorId,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    newValue: { email: user.email, roleId: user.roleId },
  });

  return user;
}

export async function updateUser(
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    roleId: string;
    departmentId: string | null;
    isActive: boolean;
  }>,
  actorId: string
) {
  const previous = await prisma.user.findUnique({ where: { id } });
  if (!previous) throw new Error('User not found');

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { role: true, department: true },
  });

  await createAuditLog({
    actorId,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: id,
    previousValue: previous,
    newValue: data,
  });

  return user;
}

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      mfaEnabled: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      role: { select: { id: true, name: true, slug: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: { select: { name: true, slug: true } },
      department: { select: { name: true } },
    },
  });
}
