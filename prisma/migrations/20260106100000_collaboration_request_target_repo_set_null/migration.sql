-- Change CollaborationRequest.targetRepoId to nullable and use SetNull on delete
-- This preserves collaboration request history when a repository is deleted

-- Make targetRepoId nullable
ALTER TABLE "collaboration_requests" ALTER COLUMN "targetRepoId" DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE "collaboration_requests" DROP CONSTRAINT IF EXISTS "collaboration_requests_targetRepoId_fkey";

-- Add new foreign key with ON DELETE SET NULL
ALTER TABLE "collaboration_requests"
ADD CONSTRAINT "collaboration_requests_targetRepoId_fkey"
FOREIGN KEY ("targetRepoId") REFERENCES "repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
