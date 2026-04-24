import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactComponent from "@/components/Contact";
import TitleManager from "@/components/TitleManager";
import { useI18n } from "@/i18n";

const ContactPage = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <TitleManager 
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
