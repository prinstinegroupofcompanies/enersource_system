-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "estimatedValue" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assignedToId" TEXT,
    "customerId" TEXT,
    "nextFollowUpAt" DATETIME,
    "convertedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "activityDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,
    "customerId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrmActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "leadId" TEXT,
    "customerId" TEXT,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmReminder_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrmReminder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadNumber_key" ON "Lead"("leadNumber");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Lead_customerId_idx" ON "Lead"("customerId");

-- CreateIndex
CREATE INDEX "CrmActivity_leadId_idx" ON "CrmActivity"("leadId");

-- CreateIndex
CREATE INDEX "CrmActivity_customerId_idx" ON "CrmActivity"("customerId");

-- CreateIndex
CREATE INDEX "CrmActivity_activityDate_idx" ON "CrmActivity"("activityDate");

-- CreateIndex
CREATE INDEX "CrmReminder_assignedToId_status_idx" ON "CrmReminder"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "CrmReminder_dueAt_idx" ON "CrmReminder"("dueAt");

-- CreateIndex
CREATE INDEX "CrmReminder_leadId_idx" ON "CrmReminder"("leadId");

-- CreateIndex
CREATE INDEX "CrmReminder_customerId_idx" ON "CrmReminder"("customerId");
