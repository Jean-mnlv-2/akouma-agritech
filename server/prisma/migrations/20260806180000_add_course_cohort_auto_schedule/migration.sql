-- Planification automatique de cohorte : date de début + intervalle en
-- jours au niveau du cours, pour calculer seul la date d'ouverture de
-- chaque module (au lieu de la saisir à la main pour chacun).
ALTER TABLE "Course" ADD COLUMN "cohortStartDate" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN "cohortIntervalDays" INTEGER;
