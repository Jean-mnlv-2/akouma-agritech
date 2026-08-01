-- Track whether an unpaid-order reminder email has already been sent, so the
-- daily cron doesn't resend it on every run within the 3-7 day window.
ALTER TABLE "Order" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
