/*
  Warnings:

  - You are about to drop the column `fsnSector` on the `PortfolioCompany` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PortfolioCompany" DROP COLUMN "fsnSector",
ADD COLUMN     "sector" TEXT;
