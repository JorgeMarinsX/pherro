-- Change Vehicle.price from Decimal(12,2) to Int (whole BRL).
-- Existing values rounded to nearest integer.

ALTER TABLE "Vehicle"
  ALTER COLUMN "price" TYPE INTEGER USING ROUND("price")::integer;
