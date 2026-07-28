import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactComponent from "@/components/Contact";
import { SEO } from "@/components/SEO";
import { useI18n } from "@/i18n";

const ContactPage = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t("contact.title")}
        description={t("contact.subtitle")}
      />
      <Header />
      <main className="pt-16">
        <ContactComponent />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
