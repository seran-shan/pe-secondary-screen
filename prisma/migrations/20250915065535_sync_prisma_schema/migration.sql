/*
  Warnings:

  - You are about to drop the column `financials` on the `PortfolioCompany` table. All the data in the column will be lost.
  - You are about to drop the column `nextSteps` on the `PortfolioCompany` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `PortfolioCompany` table. All the data in the column will be lost.
  - Added the required column `status` to the `PortfolioCompany` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('ACTIVE', 'EXITED');

-- AlterTable
ALTER TABLE "public"."PortfolioCompany" DROP COLUMN "financials",
DROP COLUMN "nextSteps",
DROP COLUMN "note",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "public"."CompanyStatus" NOT NULL;
