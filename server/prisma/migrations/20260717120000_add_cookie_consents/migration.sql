-- GDPR cookie consent audit log
CREATE TABLE "CookieConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "necessary" BOOLEAN NOT NULL DEFAULT true,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "preferences" BOOLEAN NOT NULL DEFAULT false,
    "method" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "url" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CookieConsent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CookieConsent_userId_createdAt_idx" ON "CookieConsent"("userId", "createdAt");
CREATE INDEX "CookieConsent_anonId_createdAt_idx" ON "CookieConsent"("anonId", "createdAt");
CREATE INDEX "CookieConsent_createdAt_idx" ON "CookieConsent"("createdAt");