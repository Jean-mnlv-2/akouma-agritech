-- CreateTable
CREATE TABLE "PageHeaderImage" (
    "id" SERIAL NOT NULL,
    "pageKey" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageHeaderImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageHeaderImage_pageKey_idx" ON "PageHeaderImage"("pageKey");
CREATE INDEX "PageHeaderImage_isActive_idx" ON "PageHeaderImage"("isActive");
CREATE INDEX "PageHeaderImage_order_idx" ON "PageHeaderImage"("order");