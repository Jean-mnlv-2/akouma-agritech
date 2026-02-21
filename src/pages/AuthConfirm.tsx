import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/integrations/api/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/i18n";

export default function AuthConfirm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const run = async () => {
      try {
        // Supporte le callback Supabase (hash ou query)
        const url = new URL(window.location.href);
        const hasCode = url.hash.includes("access_token") || url.searchParams.has("code");

        if (!hasCode) {
          setStatus("error");
          toast({
            title: t("auth.confirm.invalid"),
            description: t("auth.confirm.invalid_desc"),
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Méthode moderne
        const { error } = await api.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        // Récupérer la session et vérifier is_active + rôle
        const { data: sessionData } = await api.auth.getSession();
        const userId = sessionData.session?.user?.id;

        if (!userId) {
          throw new Error(t("auth.confirm.session_error"));
        }

        // Vérifier profil actif
        const { data: profile, error: profErr } = await api
          .from("profiles")
          .select("is_active")
          .eq("user_id", userId)
          .single();

        if (profErr) throw profErr;
        if (profile?.is_active === false) {
          await api.auth.signOut();
          toast({ title: t("auth.confirm.disabled"), description: t("auth.confirm.disabled_desc"), variant: "destructive" });
          navigate("/auth");
          return;
        }

        // Vérifier le rôle admin
        const { data: roles, error: rolesError } = await api
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (rolesError) throw rolesError;

        setStatus("success");
        toast({ title: t("auth.confirm.success"), description: t("auth.confirm.welcome") });

        if (roles?.some((r: { role: string }) => r.role === "admin")) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } catch (e: any) {
        console.error("Auth confirm error:", e);
        setStatus("error");
        toast({
          title: t("auth.confirm.error"),
          description: e?.message || t("auth.confirm.error_desc"),
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    run();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <LoadingSpinner size="large" text={status === "loading" ? t("auth.confirm.loading") : t("auth.confirm.redirect")} />
    </div>
  );
}
