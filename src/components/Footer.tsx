import { Button } from "@/components/ui/button";
import PWAInstallButton from "@/components/PWAInstallButton";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useContactSettings } from "@/hooks/use-contact-settings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useI18n();
  const { data: contact } = useContactSettings();

  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <img 
                src="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
                alt="AKOUMA Logo" 
                className="w-10 h-10"
              />
              <span className="text-2xl font-bold text-primary">
                AKOUMA
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Révolutionner l'agriculture africaine grâce à des technologies innovantes 
              et durables pour un avenir prospère.
            </p>
            <div className="flex space-x-4">
              {contact?.facebookUrl && (
                <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                    <Facebook className="w-4 h-4" />
                  </Button>
                </a>
              )}
              {contact?.xUrl && (
                <a href={contact.xUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                    <Twitter className="w-4 h-4" />
                  </Button>
                </a>
              )}
              {contact?.linkedinUrl && (
                <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                </a>
              )}
              {contact?.instagramUrl && (
                <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                    <Instagram className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">{t("footer.solutions")}</h3>
            <ul className="space-y-3">
              {[
                t("solutions.iot"),
                t("solutions.analytics"),
                t("solutions.weather"),
                t("solutions.app"),
                t("solutions.ai"),
                t("solutions.sustainable")
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">{t("footer.company")}</h3>
            <ul className="space-y-3">
              {[
                { name: t("company.about"), href: "/about" },
                { name: t("company.team"), href: "/about#team" },
                { name: t("company.careers"), href: "/careers" },
                { name: t("company.news"), href: "/news" },
                { name: t("company.partners"), href: "/partners" },
                { name: t("company.donations"), href: "/donations" },
                { name: t("company.investors"), href: "/investors" }
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">{t("footer.contact")}</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-muted-foreground text-sm">
                  <p>{contact?.city || t("footer.city")}</p>
                  <p>{contact?.addressLine1 || t("footer.address")}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm">{contact?.phone || '+237 233 XX XX XX'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm">{contact?.email || 'contact@akouma.cm'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-8 border-t border-border/50">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("footer.newsletter.title")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("footer.newsletter.subtitle")}
              </p>
            </div>
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border/50">
          <div className="flex justify-center mb-4">
            <PWAInstallButton />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © {currentYear} AKOUMA. {t("footer.rights")}
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.privacy")}
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.terms")}
              </a>
              <a href="/legal" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.legal")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;