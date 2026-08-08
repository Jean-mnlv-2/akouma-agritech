-- Reprise vidéo/PDF par module (un cours à plusieurs vidéos/PDF ne doit pas
-- partager une seule position de reprise pour tous ses modules).
ALTER TABLE "ModuleProgress" ADD COLUMN "videoPositionSec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ModuleProgress" ADD COLUMN "pdfPage" INTEGER NOT NULL DEFAULT 1;
