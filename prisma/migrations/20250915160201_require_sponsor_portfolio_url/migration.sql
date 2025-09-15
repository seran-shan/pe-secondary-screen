/*
  Warnings:

  - Made the column `portfolioUrl` on table `Sponsor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Sponsor" ALTER COLUMN "portfolioUrl" SET NOT NULL;
