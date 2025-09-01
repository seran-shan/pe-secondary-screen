-- DropForeignKey
ALTER TABLE "public"."Alert" DROP CONSTRAINT "Alert_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Run" DROP CONSTRAINT "Run_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Sponsor" ADD COLUMN     "portfolioUrl" VARCHAR(512);

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."PortfolioCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
