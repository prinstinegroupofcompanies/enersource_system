-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryNumber" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRule" TEXT,
    "reversedFromId" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "postedById" TEXT,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_reversedFromId_fkey" FOREIGN KEY ("reversedFromId") REFERENCES "JournalEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "lineOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChartOfAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "normalBalance" TEXT NOT NULL DEFAULT 'DEBIT',
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ChartOfAccount" ("balance", "category", "code", "createdAt", "id", "isActive", "name", "parentId", "subCategory", "updatedAt") SELECT "balance", "category", "code", "createdAt", "id", "isActive", "name", "parentId", "subCategory", "updatedAt" FROM "ChartOfAccount";
DROP TABLE "ChartOfAccount";
ALTER TABLE "new_ChartOfAccount" RENAME TO "ChartOfAccount";
CREATE UNIQUE INDEX "ChartOfAccount_code_key" ON "ChartOfAccount"("code");
CREATE INDEX "ChartOfAccount_category_idx" ON "ChartOfAccount"("category");
CREATE INDEX "ChartOfAccount_parentId_idx" ON "ChartOfAccount"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalEntry_entryDate_idx" ON "JournalEntry"("entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_createdById_idx" ON "JournalEntry"("createdById");

-- CreateIndex
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");
