-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "cities" TEXT NOT NULL DEFAULT '[]';

-- Backfill: "city" used to be a single free-text value; carry each
-- existing one over as a one-element JSON array so nobody's current
-- match radius silently disappears once the column below is dropped.
UPDATE "UserPreference"
SET "cities" = '["' || replace(replace("city", '\', '\\'), '"', '\"') || '"]'
WHERE "city" IS NOT NULL AND "city" <> '';

-- AlterTable
ALTER TABLE "UserPreference" DROP COLUMN "city";
