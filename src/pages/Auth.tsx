import { useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TitleManager from "@/components/TitleManager";
import { useI18n } from "@/i18n/i18n";

export default function Auth() {
  const { t } = useI18n();
  
  useEffect(() => {
    sessionStorage.removeItem('admin_access_granted');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TitleManager
        title={t("auth.meta.title") || "Connexion - AKOUMA"}
        description={t("auth.meta.desc") || "Connectez-vous à votre compte AKOUMA"}
        canonical={window.location.origin + '/auth'}
        image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
      />
      <Header />
      <main className="flex-1">
        <AuthForm />
      </main>
      <Footer />
    </div>
  );
}