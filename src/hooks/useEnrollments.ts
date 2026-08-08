import { useCallback, useEffect, useState } from "react";
import { api } from "@/integrations/api/client";

export interface EnrollmentCourseSummary {
  id: number;
  title: string;
  slug?: string;
  category?: string;
  level?: string;
  duration?: number | null;
  thumbnailUrl?: string | null;
  modules?: { id: number }[];
}

export interface Enrollment {
  id: number;
  userId: string | number;
  courseId: number;
  enrolledAt: string;
  completedAt?: string | null;
  progress?: number;
  studyPace?: string;
  targetEndDate?: string | null;
  remindersEnabled?: boolean;
  currentModuleId?: number | null;
  professionalActivity?: string | null;
  organization?: string | null;
  sector?: string | null;
  experienceLevel?: string | null;
  expectations?: string | null;
  course?: EnrollmentCourseSummary;
  moduleProgress?: { moduleId: number; completedAt?: string | null }[];
}

/**
 * Wraps GET /api/elearning_enrollments. Passing `courseId` scopes the
 * request server-side instead of fetching every enrollment and filtering
 * client-side (the pattern repeated across ELearning/CourseDetail/CourseLearn/
 * MyCourses/LearningDashboard before this hook existed).
 */
export function useEnrollments(opts?: { courseId?: number; enabled?: boolean }) {
  const { courseId, enabled = true } = opts || {};
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const params = courseId ? `?courseId=${courseId}` : "";
      const res = await api.request("GET", `/api/elearning_enrollments${params}`);
      setEnrollments(res.data || []);
    } catch (err) {
      console.error("Error fetching enrollments:", err);
      setError("Impossible de charger vos inscriptions.");
    } finally {
      setLoading(false);
    }
  }, [courseId, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const findEnrollment = useCallback(
    (targetCourseId: number | string) => enrollments.find((e) => Number(e.courseId) === Number(targetCourseId)),
    [enrollments],
  );

  // Un utilisateur ayant déjà renseigné son profil sur une autre formation ne
  // doit plus se voir reposer ces questions à chaque nouvelle inscription.
  const knownProfile = enrollments.find((e) => !!e.professionalActivity) || null;

  return { enrollments, loading, error, refetch, findEnrollment, knownProfile };
}
