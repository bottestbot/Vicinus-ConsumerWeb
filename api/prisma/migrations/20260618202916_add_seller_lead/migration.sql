-- CreateTable
CREATE TABLE "SellerLead" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "sellingPriority" TEXT,
    "biggestHurdle" TEXT,
    "advisoryPreference" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "valuation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerLead_pkey" PRIMARY KEY ("id")
);
