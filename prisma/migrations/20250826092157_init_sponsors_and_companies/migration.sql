/*
  Warnings:

  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_companyId_fkey";

-- AlterTable
ALTER TABLE "public"."PortfolioCompany" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "ewComment" TEXT,
ADD COLUMN     "mmComment" TEXT,
ADD COLUMN     "nextSteps" TEXT,
ADD COLUMN     "note" TEXT;

-- DropTable
DROP TABLE "public"."Comment";
