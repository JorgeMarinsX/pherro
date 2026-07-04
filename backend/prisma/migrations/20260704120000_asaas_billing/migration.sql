-- Billing (Asaas): tenant document + provider ids, webhook dedupe ledger.
-- AsaasWebhookEvent is platform-owned (no tenantId) — intentionally outside RLS.

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "asaasSubscriptionId" TEXT,
ADD COLUMN     "cpfCnpj" TEXT;

-- CreateTable
CREATE TABLE "AsaasWebhookEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsaasWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_asaasCustomerId_key" ON "Tenant"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_asaasSubscriptionId_key" ON "Tenant"("asaasSubscriptionId");
