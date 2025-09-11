-- DropForeignKey
ALTER TABLE "public"."Run" DROP CONSTRAINT "Run_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Sponsor" ADD COLUMN     "portfolioUrl" VARCHAR(512);

-- AddForeignKey
ALTER TABLE "public"."Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
