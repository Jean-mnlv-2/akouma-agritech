-- Certificate issuance tracking with queue
CREATE TABLE IF NOT EXISTS "Certificate" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "courseId" INTEGER NOT NULL,
  "enrollmentId" INTEGER,
  "certificateNumber" TEXT NOT NULL UNIQUE,
  "score" INTEGER,
  "completionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "campaignId" TEXT,
  "credentialId" TEXT,
  "credentialUrl" TEXT,
  "issuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certificate_user_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Certificate_course_fk" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Certificate_userId_idx" ON "Certificate"("userId");
CREATE INDEX IF NOT EXISTS "Certificate_courseId_idx" ON "Certificate"("courseId");
CREATE INDEX IF NOT EXISTS "Certificate_status_idx" ON "Certificate"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_user_course_unique" ON "Certificate"("userId","courseId");
