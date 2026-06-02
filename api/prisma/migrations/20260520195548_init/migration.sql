-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'buyer',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "ddfListingKey" TEXT NOT NULL,
    "ddfListingId" TEXT,
    "realtorUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "displayOnInternet" BOOLEAN NOT NULL DEFAULT true,
    "price" DOUBLE PRECISION,
    "leaseAmount" DOUBLE PRECISION,
    "leaseFrequency" TEXT,
    "propertySubType" TEXT,
    "beds" INTEGER,
    "baths" DOUBLE PRECISION,
    "bathsPartial" INTEGER,
    "sqft" INTEGER,
    "lotSize" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "parkingTotal" INTEGER,
    "stories" INTEGER,
    "address" TEXT,
    "streetNumber" TEXT,
    "streetName" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Canada',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "description" TEXT,
    "images" JSONB,
    "photosCount" INTEGER,
    "heating" JSONB,
    "cooling" JSONB,
    "basement" JSONB,
    "parkingFeatures" JSONB,
    "exteriorFeatures" JSONB,
    "taxAnnual" DOUBLE PRECISION,
    "taxYear" INTEGER,
    "ddfAgentKey" TEXT,
    "ddfOfficeKey" TEXT,
    "neighbourhoodId" TEXT,
    "isCuratorPick" BOOLEAN NOT NULL DEFAULT false,
    "editorialTag" TEXT,
    "listedAt" TIMESTAMP(3),
    "ddfModifiedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "ddfMemberKey" TEXT NOT NULL,
    "fullName" TEXT,
    "jobTitle" TEXT,
    "phone" TEXT,
    "emailVisible" BOOLEAN NOT NULL DEFAULT false,
    "province" TEXT,
    "avatarUrl" TEXT,
    "socialMedia" JSONB,
    "ddfOfficeKey" TEXT,
    "ddfModifiedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "ddfOfficeKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "logoUrl" TEXT,
    "ddfModifiedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenHouse" (
    "id" TEXT NOT NULL,
    "ddfOpenHouseKey" TEXT NOT NULL,
    "ddfListingKey" TEXT,
    "openHouseDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "openHouseType" TEXT,
    "status" TEXT,
    "remarks" TEXT,

    CONSTRAINT "OpenHouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neighbourhood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "bio" TEXT,
    "medianPrice" DOUBLE PRECISION,
    "walkScore" INTEGER,
    "transitScore" INTEGER,
    "livingGrade" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Neighbourhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalEssential" (
    "id" TEXT NOT NULL,
    "neighbourhoodId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT,
    "rating" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION,

    CONSTRAINT "LocalEssential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProperty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitedProperty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitedProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialCuration" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "tag" TEXT,
    "propertyIds" TEXT[],
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "EditorialCuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DdfSyncLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "lastModifiedTimestamp" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,

    CONSTRAINT "DdfSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Property_ddfListingKey_key" ON "Property"("ddfListingKey");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_ddfMemberKey_key" ON "Agent"("ddfMemberKey");

-- CreateIndex
CREATE UNIQUE INDEX "Office_ddfOfficeKey_key" ON "Office"("ddfOfficeKey");

-- CreateIndex
CREATE UNIQUE INDEX "OpenHouse_ddfOpenHouseKey_key" ON "OpenHouse"("ddfOpenHouseKey");

-- CreateIndex
CREATE UNIQUE INDEX "Neighbourhood_slug_key" ON "Neighbourhood"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SavedProperty_userId_propertyId_key" ON "SavedProperty"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ddfAgentKey_fkey" FOREIGN KEY ("ddfAgentKey") REFERENCES "Agent"("ddfMemberKey") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ddfOfficeKey_fkey" FOREIGN KEY ("ddfOfficeKey") REFERENCES "Office"("ddfOfficeKey") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_ddfOfficeKey_fkey" FOREIGN KEY ("ddfOfficeKey") REFERENCES "Office"("ddfOfficeKey") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenHouse" ADD CONSTRAINT "OpenHouse_ddfListingKey_fkey" FOREIGN KEY ("ddfListingKey") REFERENCES "Property"("ddfListingKey") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalEssential" ADD CONSTRAINT "LocalEssential_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitedProperty" ADD CONSTRAINT "VisitedProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitedProperty" ADD CONSTRAINT "VisitedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
