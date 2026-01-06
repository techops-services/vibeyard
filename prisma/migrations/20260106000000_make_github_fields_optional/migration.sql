-- Make GitHub fields optional for non-GitHub vibes
-- This allows users to add vibes without linking a GitHub repository

-- Add title field for non-GitHub vibes
ALTER TABLE "repositories" ADD COLUMN "title" TEXT;

-- Make GitHub-specific fields nullable
ALTER TABLE "repositories" ALTER COLUMN "githubId" DROP NOT NULL;
ALTER TABLE "repositories" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "repositories" ALTER COLUMN "fullName" DROP NOT NULL;
ALTER TABLE "repositories" ALTER COLUMN "owner" DROP NOT NULL;
ALTER TABLE "repositories" ALTER COLUMN "htmlUrl" DROP NOT NULL;

-- Drop the existing unique constraint on githubId
DROP INDEX IF EXISTS "repositories_githubId_key";

-- Create a partial unique index that only applies to non-NULL values
-- This allows multiple repositories to have NULL githubId (for non-GitHub vibes)
CREATE UNIQUE INDEX "repositories_githubId_key" ON "repositories"("githubId") WHERE "githubId" IS NOT NULL;
