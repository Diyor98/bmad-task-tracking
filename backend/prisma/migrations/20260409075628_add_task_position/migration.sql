-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill: assign position values based on createdAt order within each (projectId, statusId) group
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "projectId", "statusId" ORDER BY "createdAt" ASC) - 1 AS pos
  FROM "Task"
)
UPDATE "Task" SET "position" = ranked.pos FROM ranked WHERE "Task".id = ranked.id;
