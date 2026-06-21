-- AlterTable
ALTER TABLE "WhatsappNumber" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "WhatsappNumber_shopConfigId_isActive_idx" ON "WhatsappNumber"("shopConfigId", "isActive");
