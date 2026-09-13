-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "learnerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "grade" INTEGER,
    "class" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupportCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "SupportSubcategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SupportSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SupportCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceNumber" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "activityType" TEXT NOT NULL,
    "activityName" TEXT,
    "comment" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportRequest_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SupportCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportRequest_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "SupportSubcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SupportRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supportRequestId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportAction_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supportRequestId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportNote_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportFollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supportRequestId" TEXT NOT NULL,
    "followUpDate" DATETIME NOT NULL,
    "responsibleUserId" TEXT NOT NULL,
    "notes" TEXT,
    "outcome" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportFollowUp_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportFollowUp_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "S3InformationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedById" TEXT NOT NULL,
    "requestText" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "S3InformationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Learner_learnerId_key" ON "Learner"("learnerId");

-- CreateIndex
CREATE INDEX "Learner_surname_idx" ON "Learner"("surname");

-- CreateIndex
CREATE INDEX "Learner_learnerId_idx" ON "Learner"("learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportCategory_name_key" ON "SupportCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupportSubcategory_categoryId_name_key" ON "SupportSubcategory"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SupportRequest_referenceNumber_key" ON "SupportRequest"("referenceNumber");

-- CreateIndex
CREATE INDEX "SupportRequest_status_idx" ON "SupportRequest"("status");

-- CreateIndex
CREATE INDEX "SupportRequest_learnerId_idx" ON "SupportRequest"("learnerId");

-- CreateIndex
CREATE INDEX "SupportRequest_submittedById_idx" ON "SupportRequest"("submittedById");

-- CreateIndex
CREATE INDEX "SupportAction_supportRequestId_idx" ON "SupportAction"("supportRequestId");

-- CreateIndex
CREATE INDEX "SupportNote_supportRequestId_idx" ON "SupportNote"("supportRequestId");

-- CreateIndex
CREATE INDEX "SupportFollowUp_supportRequestId_idx" ON "SupportFollowUp"("supportRequestId");

-- CreateIndex
CREATE INDEX "SupportFollowUp_followUpDate_idx" ON "SupportFollowUp"("followUpDate");
