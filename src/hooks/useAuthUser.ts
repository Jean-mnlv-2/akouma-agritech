import { useEffect, useState } from "react";
import { api } from "@/integrations/api/client";

export interface AuthUser {
  id: string | number;
  email: string;
  name?: string;
  fullName?: string;
  phone?: string | null;
  role?: string;
}

/**
 * Centralizes the `api.auth.getUser()` fetch duplicated across CourseLearn,
 * MyCourses and LearningDashboard. Redirect-on-absent behavior stays in each
 * page since it differs (some redirect immediately, some show inline state).
 */
export function useAuthUser(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.auth.getUser()
      .then(({ data }: { data: { user: AuthUser | null } }) => {
        if (active) setUser(data?.user || null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
