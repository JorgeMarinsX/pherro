-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "overdueSince" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
