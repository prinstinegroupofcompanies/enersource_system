-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requisitionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUPERVISOR_REVIEW',
    "projectReference" TEXT,
    "requesterId" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requisitionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL DEFAULT 0,
    "lineOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseRequisitionLine_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequisitionApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requisitionId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actedAt" DATETIME,
    CONSTRAINT "RequisitionApproval_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "requisitionId" TEXT,
    "attachmentName" TEXT,
    "attachmentPath" TEXT,
    "requesterId" TEXT NOT NULL,
    "approvedById" TEXT,
    "paidById" TEXT,
    "approvedAt" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentRequest_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentRequestId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actedAt" DATETIME,
    CONSTRAINT "PaymentApproval_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PettyCashFund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "custodianName" TEXT,
    "allocatedAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PettyCashEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "receiptName" TEXT,
    "receiptPath" TEXT,
    "reference" TEXT,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PettyCashEntry_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "PettyCashFund" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PettyCashReimbursement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requesterId" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PettyCashReimbursement_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "PettyCashFund" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_requisitionNumber_key" ON "PurchaseRequisition"("requisitionNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_status_idx" ON "PurchaseRequisition"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_requesterId_idx" ON "PurchaseRequisition"("requesterId");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionLine_requisitionId_idx" ON "PurchaseRequisitionLine"("requisitionId");

-- CreateIndex
CREATE INDEX "RequisitionApproval_requisitionId_idx" ON "RequisitionApproval"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "RequisitionApproval_requisitionId_step_key" ON "RequisitionApproval"("requisitionId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRequest_requestNumber_key" ON "PaymentRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "PaymentRequest_status_idx" ON "PaymentRequest"("status");

-- CreateIndex
CREATE INDEX "PaymentRequest_requesterId_idx" ON "PaymentRequest"("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentApproval_paymentRequestId_step_key" ON "PaymentApproval"("paymentRequestId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashFund_name_key" ON "PettyCashFund"("name");

-- CreateIndex
CREATE INDEX "PettyCashEntry_fundId_idx" ON "PettyCashEntry"("fundId");

-- CreateIndex
CREATE INDEX "PettyCashEntry_entryDate_idx" ON "PettyCashEntry"("entryDate");

-- CreateIndex
CREATE INDEX "PettyCashReimbursement_status_idx" ON "PettyCashReimbursement"("status");

-- CreateIndex
CREATE INDEX "PettyCashReimbursement_fundId_idx" ON "PettyCashReimbursement"("fundId");
