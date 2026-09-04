CREATE UNIQUE INDEX IF NOT EXISTS assessments_invitation_unique
ON assessments(invitation_id)
WHERE invitation_id IS NOT NULL;
