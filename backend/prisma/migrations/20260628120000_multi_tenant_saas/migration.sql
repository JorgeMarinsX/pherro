-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- DropIndex
DROP INDEX "AttributeDefinition_slug_key";

-- DropIndex
DROP INDEX "Lead_createdAt_idx";

-- DropIndex
DROP INDEX "Lead_phone_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "Vehicle_make_model_idx";

-- DropIndex
DROP INDEX "Vehicle_slug_key";

-- DropIndex
DROP INDEX "Vehicle_status_createdAt_idx";

-- DropIndex
DROP INDEX "Vehicle_status_price_idx";

-- DropIndex
DROP INDEX "Vehicle_status_year_idx";

-- DropIndex
DROP INDEX "VehiclePhoto_vehicleId_position_idx";

-- DropIndex
DROP INDEX "WhatsappNumber_shopConfigId_isActive_idx";

-- AlterTable
ALTER TABLE "AttributeDefinition" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LeadVehicleInterest" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ShopConfig" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VehicleAttribute" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VehiclePhoto" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WhatsappNumber" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customDomain" TEXT,
    "domainStatus" "DomainStatus" NOT NULL DEFAULT 'NONE',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- CreateTable
-- Platform-level operators: no tenantId, no RLS (like Tenant).
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_tenantId_slug_key" ON "AttributeDefinition"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Lead_tenantId_phone_idx" ON "Lead"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LeadVehicleInterest_tenantId_idx" ON "LeadVehicleInterest"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopConfig_tenantId_key" ON "ShopConfig"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_email_idx" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_status_createdAt_idx" ON "Vehicle"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_status_price_idx" ON "Vehicle"("tenantId", "status", "price");

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_status_year_idx" ON "Vehicle"("tenantId", "status", "year");

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_make_model_idx" ON "Vehicle"("tenantId", "make", "model");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_tenantId_slug_key" ON "Vehicle"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "VehicleAttribute_tenantId_idx" ON "VehicleAttribute"("tenantId");

-- CreateIndex
CREATE INDEX "VehiclePhoto_tenantId_vehicleId_position_idx" ON "VehiclePhoto"("tenantId", "vehicleId", "position");

-- CreateIndex
CREATE INDEX "WhatsappNumber_tenantId_shopConfigId_isActive_idx" ON "WhatsappNumber"("tenantId", "shopConfigId", "isActive");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopConfig" ADD CONSTRAINT "ShopConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappNumber" ADD CONSTRAINT "WhatsappNumber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAttribute" ADD CONSTRAINT "VehicleAttribute_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadVehicleInterest" ADD CONSTRAINT "LeadVehicleInterest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Row-Level Security (RLS) backstop.
-- Prisma connects as the table owner (superuser), so plain ENABLE is bypassed:
-- FORCE makes the owner subject to policies too. The tenant id is read from the
-- per-transaction GUC `app.current_tenant`, set by the Prisma extension before
-- each query. current_setting(..., true) returns NULL when unset → no rows match
-- → fail-closed (a query with no tenant context sees nothing, never everything).
-- ============================================================================

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.current_tenant', true), '') $$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User', 'ShopConfig', 'WhatsappNumber', 'Vehicle', 'VehiclePhoto',
    'AttributeDefinition', 'VehicleAttribute', 'Lead', 'LeadVehicleInterest'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ("tenantId" = current_tenant_id())
         WITH CHECK ("tenantId" = current_tenant_id())', t);
  END LOOP;
END $$;
