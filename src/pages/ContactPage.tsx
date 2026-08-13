import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactComponent from "@/components/Contact";
import { SEO } from "@/components/SEO";
import { useI18n } from "@/i18n";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import ContactAppView from "@/components/pwa/ContactAppView";

const ContactPage = () => {
  const { t } = useI18n();
  const isStandalone = useStandalonePwa();

  const seo = <SEO title={t("contact.title")} description={t("contact.subtitle")} />;

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <ContactAppView />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />
      <main className="pt-16">
        <ContactComponent />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
