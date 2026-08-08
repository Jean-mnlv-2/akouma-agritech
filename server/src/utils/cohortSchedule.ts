/**
 * Date d'ouverture effective d'un module en mode cohorte.
 *
 * Priorité : un `openDate` explicite sur le module (exception ponctuelle
 * décidée par l'admin) l'emporte toujours. Sinon, si le cours a une
 * planification automatique (`cohortStartDate` + `cohortIntervalDays` tous
 * les deux renseignés), la date se calcule seule — zéro saisie manuelle par
 * module : `cohortStartDate + module.order * cohortIntervalDays` jours.
 * Sans l'un ni l'autre, le module reste en mode auto-rythmé classique (null).
 */
export function computeEffectiveOpenDate(
  course: { cohortStartDate: Date | string | null; cohortIntervalDays: number | null },
  module: { openDate: Date | string | null; order: number },
): Date | null {
  if (module.openDate) return new Date(module.openDate);
  if (course.cohortStartDate && course.cohortIntervalDays != null) {
    const d = new Date(course.cohortStartDate);
    d.setDate(d.getDate() + module.order * course.cohortIntervalDays);
    return d;
  }
  return null;
}
