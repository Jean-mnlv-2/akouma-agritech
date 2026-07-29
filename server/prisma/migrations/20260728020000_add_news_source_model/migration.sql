-- CreateTable
CREATE TABLE "NewsSource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastStatus" TEXT,
    "lastError" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "lastArticleCount" INTEGER NOT NULL DEFAULT 0,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_url_key" ON "NewsSource"("url");

-- Migre les sources précédemment codées en dur dans
-- server/src/config/newsSources.ts vers cette table, y compris les 4 flux
-- RSS AllAfrica vérifiés manuellement (XML valide, items réels confirmés).
INSERT INTO "NewsSource" ("name","url","type","language","category","enabled","updatedAt") VALUES
('MINADER','https://www.minader.cm','web','fr','Local',true,CURRENT_TIMESTAMP),
('ONCC','https://www.oncc.cm','web','fr','Local',true,CURRENT_TIMESTAMP),
('Cameroon Tribune','https://www.cameroon-tribune.cm','web','fr','Local',true,CURRENT_TIMESTAMP),
('CommodAfrica','https://www.commodafrica.com','web','fr','Régional',true,CURRENT_TIMESTAMP),
('Willagri','https://www.willagri.com','web','fr','Régional',true,CURRENT_TIMESTAMP),
('Afrique Agriculture','https://www.afrique-agriculture.org','web','fr','Régional',true,CURRENT_TIMESTAMP),
('Jeune Afrique Économie','https://www.jeuneafrique.com/economie','web','fr','Régional',true,CURRENT_TIMESTAMP),
('Médiaterre Afrique centrale','https://www.mediaterre.org/afrique-centrale','web','fr','Régional',true,CURRENT_TIMESTAMP),
('AllAfrica — Aliments et Agriculture','https://fr.allafrica.com/tools/headlines/rdf/agriculture/headlines.rdf','rss','fr','Régional',true,CURRENT_TIMESTAMP),
('AllAfrica — Food and Agriculture','https://allafrica.com/tools/headlines/rdf/agriculture/headlines.rdf','rss','en','Régional',true,CURRENT_TIMESTAMP),
('AllAfrica — Afrique de l''Ouest','https://fr.allafrica.com/tools/headlines/rdf/westafrica/headlines.rdf','rss','fr','Régional',true,CURRENT_TIMESTAMP),
('AllAfrica — Environment','https://allafrica.com/tools/headlines/rdf/environment/headlines.rdf','rss','en','Environnement',true,CURRENT_TIMESTAMP),
('Farmonaut Blog','https://farmonaut.com/precision-farming','web','en','Innovation',true,CURRENT_TIMESTAMP),
('10times Agritech','https://10times.com/agritech','web','en','Innovation',true,CURRENT_TIMESTAMP);
