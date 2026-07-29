-- ChatDailyBudget was previously created via `prisma db push` and never had
-- its own migration file, breaking `prisma migrate deploy` on a fresh
-- database (20260722170000_split_chat_budget_free_pro ALTERs a table that
-- never existed). This recreates it in its pre-split shape (single "usage"
-- column), which that later migration then splits into freeUsage/proUsage.
CREATE TABLE "ChatDailyBudget" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "usage" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatDailyBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatDailyBudget_userId_date_key" ON "ChatDailyBudget"("userId", "date");
CREATE INDEX "ChatDailyBudget_userId_date_idx" ON "ChatDailyBudget"("userId", "date");

ALTER TABLE "ChatDailyBudget"
  ADD CONSTRAINT "ChatDailyBudget_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
