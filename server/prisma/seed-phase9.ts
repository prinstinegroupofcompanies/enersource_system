import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../uploads');

function writeSeedFile(name: string, content: string) {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

export async function seedPhase9(prisma: PrismaClient, adminUserId: string) {
  if ((await prisma.chatChannel.count()) > 0) return;

  const exec = await prisma.department.findUnique({ where: { code: 'EXEC' } });
  const ops = await prisma.department.findUnique({ where: { code: 'OPS' } });
  const sales = await prisma.department.findUnique({ where: { code: 'SALES' } });

  const general = await prisma.chatChannel.create({
    data: {
      name: 'Company Announcements',
      slug: 'announcements',
      type: 'ANNOUNCEMENT',
      description: 'Official company-wide updates',
      messages: {
        create: {
          senderId: adminUserId,
          body: 'Welcome to Enersource ERP Phase 9 — staff messaging and document archive are now live.',
        },
      },
    },
  });

  const opsChannel = ops
    ? await prisma.chatChannel.create({
        data: {
          name: 'Operations Team',
          slug: 'ops-team',
          type: 'DEPARTMENT',
          departmentId: ops.id,
          description: 'Installations, site coordination, and field updates',
          messages: {
            create: [
              {
                senderId: adminUserId,
                body: 'Reminder: safety briefing mandatory before all rooftop work this week.',
              },
              {
                senderId: adminUserId,
                body: 'Site A panel delivery confirmed for Thursday.',
              },
            ],
          },
        },
      })
    : null;

  if (sales) {
    await prisma.chatChannel.create({
      data: {
        name: 'Sales & Marketing',
        slug: 'sales-team',
        type: 'DEPARTMENT',
        departmentId: sales.id,
        description: 'Pipeline updates and client coordination',
        messages: {
          create: {
            senderId: adminUserId,
            body: 'Q2 targets uploaded — please review your pipeline in CRM.',
          },
        },
      },
    });
  }

  await prisma.chatChannel.create({
    data: {
      name: 'General Discussion',
      slug: 'general',
      type: 'GENERAL',
      description: 'Open channel for all staff',
    },
  });

  const policyPath = writeSeedFile(
    'seed-safety-policy-v1.txt',
    'Enersource Solar — Site Safety Policy v1.0\n\nAll technicians must use harnesses on rooftops above 2m.'
  );
  const handbookPath = writeSeedFile(
    'seed-employee-handbook-v1.txt',
    'Enersource Employee Handbook — draft for internal use.'
  );

  await prisma.document.create({
    data: {
      documentNumber: `DOC-${new Date().getFullYear()}-00001`,
      title: 'Site Safety Policy',
      description: 'Mandatory safety requirements for installation crews',
      category: 'POLICY',
      createdById: adminUserId,
      versions: {
        create: {
          versionNumber: 1,
          fileName: 'site-safety-policy-v1.txt',
          storedPath: policyPath,
          mimeType: 'text/plain',
          fileSize: fs.statSync(policyPath).size,
          changeNotes: 'Initial policy release',
          uploadedById: adminUserId,
        },
      },
    },
  });

  const handbook = await prisma.document.create({
    data: {
      documentNumber: `DOC-${new Date().getFullYear()}-00002`,
      title: 'Employee Handbook',
      category: 'HR',
      createdById: adminUserId,
      versions: {
        create: {
          versionNumber: 1,
          fileName: 'employee-handbook-v1.txt',
          storedPath: handbookPath,
          mimeType: 'text/plain',
          fileSize: fs.statSync(handbookPath).size,
          uploadedById: adminUserId,
        },
      },
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentId: handbook.id,
      versionNumber: 2,
      fileName: 'employee-handbook-v2.txt',
      storedPath: writeSeedFile(
        'seed-employee-handbook-v2.txt',
        'Enersource Employee Handbook v2 — updated leave policy section.'
      ),
      mimeType: 'text/plain',
      fileSize: 64,
      changeNotes: 'Updated leave policy',
      uploadedById: adminUserId,
    },
  });

  console.log(`  Phase 9 seeded (channels: ${general.slug}${opsChannel ? `, ${opsChannel.slug}` : ''}, 2 documents)`);
}
