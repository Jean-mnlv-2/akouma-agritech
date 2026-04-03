import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/integrations/api/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        console.log("[AdminRoute] Checking authorization...");
        const cachedUser = sessionStorage.getItem('kilimo_auth_user');
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            console.log("[AdminRoute] Found cached user:", user.email, "Role:", user.role);
            if ((user?.role === 'admin' || user?.role === 'supervisor') && user?.isActive !== false) {
              setAuthorized(true);
              setLoading(false);
              // Clear cache after use, future checks will use cookie/session
              sessionStorage.removeItem('kilimo_auth_user');
              return;
            }
          } catch (e) {
            console.error("[AdminRoute] Cache parse error:", e);
            sessionStorage.removeItem('kilimo_auth_user');
          }
        }

        // Fallback: verify via API session cookie
        const { data: { user } } = await api.auth.getUser();
        console.log("[AdminRoute] API session user:", user?.email, "Role:", (user as any)?.role);
        
        if (!user) {
          console.warn("[AdminRoute] No user session found, redirecting to /auth");
          toast({ title: "Authentification requise", description: "Veuillez vous connecter." });
          navigate("/auth");
          return;
        }

        const role = (user as any)?.role;
        const isActive = (user as any)?.isActive ?? true;

        if (isActive === false) {
          await api.auth.signOut();
          toast({ title: "Compte désactivé", description: "Contactez un administrateur.", variant: "destructive" });
          navigate("/auth");
          return;
        }

        const isAuthorized = role === "admin" || role === "supervisor";

        if (!isAuthorized) {
          toast({ title: "Accès refusé", description: "Permissions administrateur requises.", variant: "destructive" });
          navigate("/auth");
          return;
        }

        setAuthorized(true);
      } catch (e) {
        console.error("AdminRoute error:", e);
        toast({ title: "Erreur", description: "Impossible de vérifier les autorisations.", variant: "destructive" });
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <LoadingSpinner size="large" text="Vérification des autorisations..." />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <p className="text-muted-foreground">Accès non autorisé. Redirection...</p>
      </div>
    );
  }

  return (
    <div className="admin-route-wrapper min-h-screen bg-background" translate="no">
      {children}
    </div>
  );
}
