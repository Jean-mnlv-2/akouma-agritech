import { Button } from "@/components/ui/button";
import PWAInstallButton from "@/components/PWAInstallButton";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/i18n";
import { useContactSettings } from "@/hooks/use-contact-settings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useI18n();
  const { data: contact } = useContactSettings();

  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Footer - Compact on mobile */}
        <div className="py-8 md:py-16 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
          {/* Company Info - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4 md:mb-6">
              <img 
                src="/kilimo-logo.png"
                alt="KILIMO Logo" 
                className="w-10 h-10 md:w-14 md:h-14"
              />
              <span className="text-2xl md:text-3xl font-bold text-primary">
                KILIMO
              </span>
            </div>
            <p className="text-muted-foreground mb-4 md:mb-6 leading-relaxed text-base">
              {t("footer.desc") || "Révolutionner l'agriculture africaine grâce à des technologies innovantes et durables pour un avenir prospère."}
            </p>
            <div className="flex space-x-3">
              {contact?.facebookUrl && (
                <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook KILIMO" title="Facebook KILIMO">
                  <Button variant="outline" size="icon" className="w-10 h-10 hover:bg-primary hover:text-primary-foreground">
                    <Facebook className="w-5 h-5" />
                  </Button>
                </a>
              )}
              {contact?.xUrl && (
                <a href={contact.xUrl} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) KILIMO" title="X (Twitter) KILIMO">
                  <Button variant="outline" size="icon" className="w-10 h-10 hover:bg-primary hover:text-primary-foreground">
                    <Twitter className="w-5 h-5" />
                  </Button>
                </a>
              )}
              {contact?.linkedinUrl && (
                <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn KILIMO" title="LinkedIn KILIMO">
                  <Button variant="outline" size="icon" className="w-10 h-10 hover:bg-primary hover:text-primary-foreground">
                    <Linkedin className="w-5 h-5" />
                  </Button>
                </a>
              )}
              {contact?.instagramUrl && (
                <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram KILIMO" title="Instagram KILIMO">
                  <Button variant="outline" size="icon" className="w-10 h-10 hover:bg-primary hover:text-primary-foreground">
                    <Instagram className="w-5 h-5" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-base md:text-xl font-semibold text-foreground mb-3 md:mb-6">{t("footer.company")}</h3>
            <ul className="space-y-2 md:space-y-3">
              {[
                { name: t("company.about"), href: "/about" },
                { name: t("company.team"), href: "/about#team" },
                { name: t("company.careers"), href: "/careers" },
                { name: t("company.news"), href: "/news" },
                { name: t("company.partners"), href: "/partners" },
                { name: t("company.donations"), href: "/donations" },
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-sm md:text-base">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-base md:text-xl font-semibold text-foreground mb-3 md:mb-6">{t("footer.contact")}</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-muted-foreground text-sm md:text-base">
                  <p>{contact?.city || t("footer.city")}</p>
                  <p>{contact?.addressLine1 || t("footer.address")}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm md:text-base">{contact?.phone || '+237 233 XX XX XX'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm md:text-base">{contact?.email || 'contact@KILIMO.cm'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter - Compact */}
        <div className="py-6 md:py-8 border-t border-border/50">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-4 md:mb-6">
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-1 md:mb-2">
                {t("footer.newsletter.title")}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                {t("footer.newsletter.subtitle")}
              </p>
            </div>
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 md:py-6 border-t border-border/50">
          <div className="flex justify-center mb-3 md:mb-4">
            <PWAInstallButton />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <p className="text-muted-foreground text-sm md:text-base">
              © {currentYear} KILIMO. {t("footer.rights")}
            </p>
            <div className="flex space-x-4 md:space-x-6 text-sm md:text-base">
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.privacy")}
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                {t("footer.terms")}
              </a>
              <button
                type="button"
                onClick={() => {
                  import("@/lib/cookieConsent").then((m) => m.openCookiePreferences());
                }}
                className="text-muted-foreground hover:text-primary transition-colors underline-offset-4"
              >
                Gérer les cookies
              </button>
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
