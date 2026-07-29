-- Home type became a multi-select in the onboarding wizard, so the derived
-- projection stores a list. Carry each existing scalar over as a 1-element
-- array before dropping the column: `User.onboardingData` is the source of
-- truth and the backfill script can re-derive everything, but there is no
-- reason to make anyone re-run it for a value we already have here.

-- AlterTable
ALTER TABLE "UserPreferenceProfile" ADD COLUMN "homeTypes" TEXT[];

UPDATE "UserPreferenceProfile"
SET "homeTypes" = ARRAY["homeType"]
WHERE "homeType" IS NOT NULL;

ALTER TABLE "UserPreferenceProfile" DROP COLUMN "homeType";
