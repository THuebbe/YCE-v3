-- Add missing schema elements for YardCard Elite multi-tenancy

-- Create agencies table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes for agencies (if they don't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "agencies_slug_key" ON "agencies"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "agencies_domain_key" ON "agencies"("domain");

-- Add agencyId column to users table (if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agencyId') THEN
        ALTER TABLE "users" ADD COLUMN "agencyId" TEXT;
    END IF;
END $$;

-- Add other missing columns to users (if they don't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar') THEN
        ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emailVerified') THEN
        ALTER TABLE "users" ADD COLUMN "emailVerified" TIMESTAMP(3);
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'hashedPassword') THEN
        ALTER TABLE "users" ADD COLUMN "hashedPassword" TEXT;
    END IF;
END $$;

-- Update agencyId to be NOT NULL after adding default agencies
-- (We'll do this after creating some agencies)

-- Add foreign key constraint (if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_agencyId_fkey') THEN
        -- First, we need to make agencyId NOT NULL, but only after we have agencies
        -- For now, we'll leave it nullable until we populate it
        NULL;
    END IF;
END $$;

-- Create the unique constraint for email + agencyId (if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_email_agencyId_key') THEN
        -- We'll add this after we populate agencyId values
        NULL;
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS "users_agency_id_idx" ON "users" ("agencyId");