/*
  Warnings:

  - You are about to drop the column `comment` on the `PortfolioCompany` table. All the data in the column will be lost.
  - You are about to drop the column `ewComment` on the `PortfolioCompany` table. All the data in the column will be lost.
  - You are about to drop the column `mmComment` on the `PortfolioCompany` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PortfolioCompany" DROP COLUMN "comment",
DROP COLUMN "ewComment",
DROP COLUMN "mmComment";

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."PortfolioCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
