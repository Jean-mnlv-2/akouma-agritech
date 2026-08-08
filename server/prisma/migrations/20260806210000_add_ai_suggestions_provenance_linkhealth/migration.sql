-- Provenance du contenu (admin vs DeerFlow), santé des liens vidéo/PDF, et
-- table générique de suggestions IA à valider par un humain.

ALTER TABLE "Course" ADD COLUMN "createdVia" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "CourseModule" ADD COLUMN "createdVia" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "CourseModule" ADD COLUMN "linkBroken" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CourseModule" ADD COLUMN "linkLastCheckedAt" TIMESTAMP(3);

CREATE TABLE "AiSuggestion" (
  "id" SERIAL NOT NULL,
  "type" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiSuggestion_type_idx" ON "AiSuggestion"("type");
CREATE INDEX "AiSuggestion_status_idx" ON "AiSuggestion"("status");
CREATE INDEX "AiSuggestion_targetType_targetId_idx" ON "AiSuggestion"("targetType", "targetId");
