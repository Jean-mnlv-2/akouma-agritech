-- Progression par cohorte : date d'ouverture par module (null = verrouillage
-- séquentiel classique inchangé), typage des rappels pour déduplication, et
-- workflow de demande de rattrapage résolu par un admin.

ALTER TABLE "CourseModule" ADD COLUMN "openDate" TIMESTAMP(3);
CREATE INDEX "CourseModule_courseId_openDate_idx" ON "CourseModule"("courseId", "openDate");

ALTER TABLE "ReminderLog" ADD COLUMN "moduleId" INTEGER;
ALTER TABLE "ReminderLog" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'learning_pace';
CREATE INDEX "ReminderLog_enrollmentId_moduleId_type_idx" ON "ReminderLog"("enrollmentId", "moduleId", "type");

CREATE TABLE "RattrapageRequest" (
  "id" SERIAL NOT NULL,
  "enrollmentId" INTEGER NOT NULL,
  "moduleId" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "resolutionNote" TEXT,
  "alternateModuleId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RattrapageRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RattrapageRequest_enrollmentId_moduleId_key" ON "RattrapageRequest"("enrollmentId", "moduleId");
CREATE INDEX "RattrapageRequest_userId_idx" ON "RattrapageRequest"("userId");
CREATE INDEX "RattrapageRequest_courseId_idx" ON "RattrapageRequest"("courseId");
CREATE INDEX "RattrapageRequest_status_idx" ON "RattrapageRequest"("status");

ALTER TABLE "RattrapageRequest" ADD CONSTRAINT "RattrapageRequest_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ELearningEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RattrapageRequest" ADD CONSTRAINT "RattrapageRequest_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RattrapageRequest" ADD CONSTRAINT "RattrapageRequest_alternateModuleId_fkey" FOREIGN KEY ("alternateModuleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RattrapageRequest" ADD CONSTRAINT "RattrapageRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
