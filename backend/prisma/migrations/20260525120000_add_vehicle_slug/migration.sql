-- Add slug column to Vehicle, backfill existing rows, enforce NOT NULL + UNIQUE.

-- 1. Add nullable column first so backfill can populate.
ALTER TABLE "Vehicle" ADD COLUMN "slug" TEXT;

-- 2. Backfill: kebab(make)-kebab(model)-year-<6 chars of id>.
--    lower + replace non-alnum with hyphen + collapse repeats + trim hyphens.
UPDATE "Vehicle"
SET "slug" = (
  regexp_replace(
    regexp_replace(
      lower("make" || '-' || "model" || '-' || "year"::text),
      '[^a-z0-9]+', '-', 'g'
    ),
    '(^-+|-+$)', '', 'g'
  )
  || '-' || substring("id" from 1 for 6)
)
WHERE "slug" IS NULL;

-- 3. Enforce NOT NULL + UNIQUE.
ALTER TABLE "Vehicle" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");
