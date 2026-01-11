import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/integrations/api/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface SupervisorRouteProps {
  children: ReactNode;
}

export default function SupervisorRoute({ children }: SupervisorRouteProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const { data: { session } } = await api.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          toast({ title: "Authentification requise", description: "Veuillez vous connecter." });
          navigate("/auth");
          return;
        }

        const { data: { user } } = await api.auth.getUser();
        const role = (user as any)?.role;
        const isActive = (user as any)?.isActive ?? true;
        if (isActive === false) {
          await api.auth.signOut();
          toast({ title: "Compte désactivé", description: "Contactez un administrateur.", variant: "destructive" });
          navigate("/auth");
          return;
        }

        const isSupervisor = role === "supervisor" || role === "admin";
        if (!isSupervisor) {
          toast({ title: "Accès refusé", description: "Permissions superviseur requises.", variant: "destructive" });
          navigate("/");
          return;
        }
      } catch (e) {
        console.error("SupervisorRoute error:", e);
        toast({ title: "Erreur", description: "Impossible de vérifier les autorisations.", variant: "destructive" });
        navigate("/");
        return;
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingSpinner size="large" text="Vérification des autorisations..." />
      </div>
    );
  }

  return <>{children}</>;
}
