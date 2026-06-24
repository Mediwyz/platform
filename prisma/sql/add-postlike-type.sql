-- Add reaction type to PostLike (like | love | sad | bad | misinfo).
-- Idempotent: safe to run on every deploy.
ALTER TABLE "PostLike" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'like';
