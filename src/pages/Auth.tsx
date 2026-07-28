import { AuthForm } from "@/components/auth/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useI18n } from "@/i18n";

export default function Auth() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={t("auth.meta.title") || "Connexion - KILIMO"}
        description={t("auth.meta.desc") || "Connectez-vous à votre compte KILIMO"}
        path={window.location.origin + '/auth'}
        image="/kilimo-logo.png"
      />
      <Header />
      <main className="flex-1">
        <AuthForm />
      </main>
      <Footer />
    </div>
  );
}
