import path from 'path';
import { prisma } from '../../lib/prisma.js';
import { nextNumber } from '../../utils/sales.js';
import { createAuditLog } from '../audit.service.js';

export async function getDocumentsSummary() {
  const [total, byCategory, recentVersions] = await Promise.all([
    prisma.document.count({ where: { status: 'ACTIVE' } }),
    prisma.document.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    }),
    prisma.documentVersion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { document: { select: { title: true, documentNumber: true, category: true } } },
    }),
  ]);

  return {
    totalDocuments: total,
    categories: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
    recentUploads: recentVersions.map((v) => ({
      id: v.id,
      documentNumber: v.document.documentNumber,
      title: v.document.title,
      category: v.document.category,
      versionNumber: v.versionNumber,
      fileName: v.fileName,
      createdAt: v.createdAt,
    })),
  };
}

export async function listDocuments(filters?: { category?: string; search?: string }) {
  const docs = await prisma.document.findMany({
    where: {
      status: 'ACTIVE',
      ...(filters?.category && { category: filters.category }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search } },
          { documentNumber: { contains: filters.search } },
        ],
      }),
    },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return docs.map((d) => ({
    id: d.id,
    documentNumber: d.documentNumber,
    title: d.title,
    description: d.description,
    category: d.category,
    versionCount: d._count.versions,
    latestVersion: d.versions[0] ?? null,
    updatedAt: d.updatedAt,
  }));
}

export async function getDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  });
  if (!doc) throw new Error('Document not found');
  return doc;
}

export async function createDocument(
  data: {
    title: string;
    description?: string;
    category?: string;
    fileName: string;
    storedPath: string;
    mimeType?: string;
    fileSize?: number;
    changeNotes?: string;
  },
  uploadedById: string
) {
  const documentNumber = await nextNumber('DOC', prisma.document);

  const doc = await prisma.document.create({
    data: {
      documentNumber,
      title: data.title,
      description: data.description,
      category: data.category ?? 'GENERAL',
      createdById: uploadedById,
      versions: {
        create: {
          versionNumber: 1,
          fileName: data.fileName,
          storedPath: data.storedPath,
          mimeType: data.mimeType,
          fileSize: data.fileSize ?? 0,
          changeNotes: data.changeNotes ?? 'Initial upload',
          uploadedById,
        },
      },
    },
    include: { versions: true },
  });

  await createAuditLog({
    actorId: uploadedById,
    action: 'DOCUMENT_CREATED',
    entityType: 'Document',
    entityId: doc.id,
  });

  return doc;
}

export async function addDocumentVersion(
  documentId: string,
  data: {
    fileName: string;
    storedPath: string;
    mimeType?: string;
    fileSize?: number;
    changeNotes?: string;
  },
  uploadedById: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
  if (!doc) throw new Error('Document not found');

  const nextVersion = (doc.versions[0]?.versionNumber ?? 0) + 1;

  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber: nextVersion,
      fileName: data.fileName,
      storedPath: data.storedPath,
      mimeType: data.mimeType,
      fileSize: data.fileSize ?? 0,
      changeNotes: data.changeNotes,
      uploadedById,
    },
  });

  await prisma.document.update({ where: { id: documentId }, data: { updatedAt: new Date() } });

  await createAuditLog({
    actorId: uploadedById,
    action: 'DOCUMENT_VERSION_ADDED',
    entityType: 'Document',
    entityId: documentId,
    newValue: { versionNumber: nextVersion },
  });

  return version;
}

export function publicFileUrl(storedPath: string): string {
  return `/api/uploads/${path.basename(storedPath)}`;
}
