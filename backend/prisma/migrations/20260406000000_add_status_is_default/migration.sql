-- AlterTable
ALTER TABLE "Status" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Set existing default statuses
UPDATE "Status" SET "isDefault" = true WHERE "order" < 4;
