-- CreateTable
CREATE TABLE "DiscoveryCallBooking" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryCallBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryCallBooking_scheduledDate_timeSlot_key" ON "DiscoveryCallBooking"("scheduledDate", "timeSlot");
