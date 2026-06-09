import { prisma } from '../../lib/prisma.js';
import { createAuditLog } from '../audit.service.js';

async function getUserDepartmentId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
  return user?.departmentId ?? null;
}

function channelAccessWhere(departmentId: string | null) {
  return {
    OR: [
      { type: { in: ['GENERAL', 'ANNOUNCEMENT'] } },
      ...(departmentId ? [{ type: 'DEPARTMENT', departmentId }] : []),
    ],
  };
}

async function accessibleChannelIds(userId: string) {
  const departmentId = await getUserDepartmentId(userId);
  const channels = await prisma.chatChannel.findMany({
    where: channelAccessWhere(departmentId),
    select: { id: true },
  });
  return channels.map((c) => c.id);
}

export async function getCommunicationSummary(userId: string) {
  const departmentId = await getUserDepartmentId(userId);
  const access = channelAccessWhere(departmentId);
  const channelIds = await accessibleChannelIds(userId);
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  const [channels, messagesToday, recentMessages] = await Promise.all([
    prisma.chatChannel.count({ where: access }),
    prisma.chatMessage.count({
      where: { channelId: { in: channelIds }, createdAt: { gte: todayStart } },
    }),
    prisma.chatMessage.findMany({
      where: { channelId: { in: channelIds } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { channel: { select: { name: true, slug: true } } },
    }),
  ]);

  const senders = await prisma.user.findMany({
    where: { id: { in: [...new Set(recentMessages.map((m) => m.senderId))] } },
    select: { id: true, firstName: true, lastName: true },
  });
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  return {
    channelCount: channels,
    messagesToday,
    recentMessages: recentMessages.map((m) => ({
      id: m.id,
      body: m.body.slice(0, 120),
      channel: m.channel.name,
      sender: senderMap.get(m.senderId)
        ? `${senderMap.get(m.senderId)!.firstName} ${senderMap.get(m.senderId)!.lastName}`
        : 'Unknown',
      createdAt: m.createdAt,
    })),
  };
}

export async function listChannels(userId: string) {
  const departmentId = await getUserDepartmentId(userId);

  const channels = await prisma.chatChannel.findMany({
    where: channelAccessWhere(departmentId),
    include: {
      department: { select: { name: true, code: true } },
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { name: 'asc' },
  });

  return channels.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.type,
    description: c.description,
    department: c.department,
    messageCount: c._count.messages,
    lastMessage: c.messages[0]
      ? { body: c.messages[0].body.slice(0, 80), createdAt: c.messages[0].createdAt }
      : null,
  }));
}

export async function getChannelMessages(channelId: string, userId: string) {
  const departmentId = await getUserDepartmentId(userId);
  const channel = await prisma.chatChannel.findFirst({
    where: { id: channelId, ...channelAccessWhere(departmentId) },
  });
  if (!channel) throw new Error('Channel not found or access denied');

  const messages = await prisma.chatMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  const senders = await prisma.user.findMany({
    where: { id: { in: [...new Set(messages.map((m) => m.senderId))] } },
    select: { id: true, firstName: true, lastName: true },
  });
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  return messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    senderId: m.senderId,
    sender: senderMap.get(m.senderId) ?? { firstName: 'Unknown', lastName: '' },
  }));
}

export async function sendMessage(channelId: string, body: string, senderId: string) {
  const departmentId = await getUserDepartmentId(senderId);
  const channel = await prisma.chatChannel.findFirst({
    where: { id: channelId, ...channelAccessWhere(departmentId) },
  });
  if (!channel) throw new Error('Channel not found or access denied');

  const message = await prisma.chatMessage.create({
    data: { channelId, senderId, body: body.trim() },
  });

  await createAuditLog({
    actorId: senderId,
    action: 'MESSAGE_SENT',
    entityType: 'ChatMessage',
    entityId: message.id,
  });

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { firstName: true, lastName: true },
  });

  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt,
    senderId,
    sender: sender ?? { firstName: 'Unknown', lastName: '' },
  };
}

export async function createChannel(
  data: { name: string; slug: string; type?: string; departmentId?: string; description?: string },
  actorId: string
) {
  const channel = await prisma.chatChannel.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type ?? 'GENERAL',
      departmentId: data.departmentId,
      description: data.description,
    },
  });

  await createAuditLog({
    actorId,
    action: 'CHANNEL_CREATED',
    entityType: 'ChatChannel',
    entityId: channel.id,
  });

  return channel;
}
