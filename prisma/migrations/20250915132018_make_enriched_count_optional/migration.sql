-- AlterTable
ALTER TABLE "public"."Run" ADD COLUMN     "addedCount" INTEGER,
ALTER COLUMN "enrichedCount" DROP NOT NULL;
