-- CreateTable
CREATE TABLE "public"."Run" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL,
    "inputSponsor" TEXT NOT NULL,
    "portfolioUrlsCount" INTEGER NOT NULL,
    "crawledCount" INTEGER NOT NULL,
    "extractedCount" INTEGER NOT NULL,
    "normalizedCount" INTEGER NOT NULL,
    "enrichedCount" INTEGER NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
