-- RedefineTables (SQLite drops FK NOT NULL by rebuilding the table)
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT,
    "supportRequestId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attachment_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("id", "resourceId", "fileName", "fileType", "fileSize", "storageKey", "version", "uploadedById", "uploadedAt")
SELECT "id", "resourceId", "fileName", "fileType", "fileSize", "storageKey", "version", "uploadedById", "uploadedAt" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE INDEX "Attachment_resourceId_idx" ON "Attachment"("resourceId");
CREATE INDEX "Attachment_supportRequestId_idx" ON "Attachment"("supportRequestId");
PRAGMA foreign_keys=ON;
