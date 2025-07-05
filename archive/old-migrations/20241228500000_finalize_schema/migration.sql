-- Finalize schema after populating agencyId values
-- Run this AFTER you've created some agencies and updated users with agencyId values

-- Create a default agency for existing users (if needed)
INSERT INTO "agencies" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
VALUES ('default-agency', 'Default Agency', 'default', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Update any users without agencyId to use the default agency
UPDATE "users" 
SET "agencyId" = 'default-agency' 
WHERE "agencyId" IS NULL;

-- Now make agencyId NOT NULL
ALTER TABLE "users" ALTER COLUMN "agencyId" SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_agencyId_fkey" 
FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the old unique constraint on email (if it exists)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";

-- Add the new unique constraint for email + agencyId
ALTER TABLE "users" ADD CONSTRAINT "users_email_agencyId_key" 
UNIQUE ("email", "agencyId");