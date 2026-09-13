-- AlterTable
ALTER TABLE "User" ADD COLUMN "staffId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_staffId_key" ON "User"("staffId");
