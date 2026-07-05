-- CreateTable
CREATE TABLE "EmailUsage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailUsage_tenantId_period_key" ON "EmailUsage"("tenantId", "period");

-- AddForeignKey
ALTER TABLE "EmailUsage" ADD CONSTRAINT "EmailUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS backstop for the new tenant-owned table (same policy as 20260628120000).
ALTER TABLE "EmailUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailUsage" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "EmailUsage"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());
