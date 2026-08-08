/**
 * Formatage et constantes partagés du module e-learning — évite que
 * MyCourses.tsx et LearningDashboard.tsx dérivent des chiffres différents
 * pour la même donnée (statut actif/complété, pénalité d'absence, etc.).
 */

export function formatCoursePrice(price: number | string): string {
  const n = Number(price);
  if (!n || n <= 0) return 'Gratuit';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(n);
}

export function getLevelColor(level?: string | null): string {
  switch ((level || '').toLowerCase()) {
    case 'débutant':
    case 'beginner':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
    case 'intermédiaire':
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
    case 'avancé':
    case 'advanced':
    case 'expert':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

// Garder en phase avec server/src/routes/courseSchedules.ts (Math.min((totalAbsences - 2) * 10, ...)),
// où le calcul reste un littéral côté backend (pas d'import cross-runtime possible).
export const ABSENCE_PENALTY = {
  THRESHOLD: 3,
  PERCENT_PER_ABSENCE: 10,
} as const;

export interface CourseStatusEnrollment {
  progress?: number | null;
  completedAt?: string | null;
}

export function deriveCourseStatus(enrollment: CourseStatusEnrollment): 'active' | 'completed' {
  const progress = Number(enrollment.progress ?? 0);
  if (enrollment.completedAt != null || progress >= 100) return 'completed';
  return 'active';
}
