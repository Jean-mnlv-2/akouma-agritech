-- Add Sertifier configuration columns to Course
ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "sertifierDesignId" TEXT,
  ADD COLUMN IF NOT EXISTS "sertifierDetailId" TEXT,
  ADD COLUMN IF NOT EXISTS "sertifierEmailTemplateId" TEXT;
