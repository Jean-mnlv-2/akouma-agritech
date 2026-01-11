import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, Briefcase } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { useI18n } from "@/i18n/i18n";
import { useContactSettings } from "@/hooks/use-contact-settings";

const buildContactInfo = (contact?: { city?: string | null; addressLine1?: string | null; phone?: string | null; whatsappNumber?: string | null; email?: string | null; }) => ([
  {
    icon: MapPin,
    title: "contact.address.title",
    details: [contact?.city || "contact.address.city", contact?.addressLine1 || "contact.address.zone"]
  },
  {
    icon: Phone,
    title: "contact.phone.title",
    details: [contact?.phone || "+237 233 XX XX XX", contact?.whatsappNumber || "+237 6XX XX XX XX"]
  },
  {
    icon: Mail,
    title: "contact.email.title",
    details: [contact?.email || "contact@akouma.cm"]
  },
  {
    icon: Clock,
    title: "contact.hours.title",
    details: ["contact.hours.week", "contact.hours.sat"]
  }
]);

const Contact = () => {
  const { t } = useI18n();
  const { data: contact } = useContactSettings();
  const location = useLocation();
  
  // Check if this is a career application
  const isCareerApplication = location.state?.prefill;
  const careerSubject = location.state?.subject;
  
  return (
    <section className="py-20 bg-gradient-nature relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl"></div>
      
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("contact.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              {t("contact.coords")}
            </h3>
            
            {buildContactInfo(contact || undefined).map((info, index) => (
              <Card key={`contact-info-${index}-${info.title}`} className="group hover:shadow-natural transition-all duration-300 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-tech rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <info.icon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {t(info.title)}
                      </h4>
                      {info.details.map((detail, detailIndex) => (
                        <p key={detailIndex} className="text-muted-foreground text-sm">
                          {detail.startsWith('contact.') ? t(detail) : detail}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Social proof */}
            <Card className="bg-gradient-hero shadow-glow">
              <CardContent className="p-6 text-center">
                <h4 className="text-xl font-bold text-primary-foreground mb-2">
                  Réponse Garantie
                </h4>
                <p className="text-primary-foreground/90 text-sm">
                  Nous nous engageons à vous répondre dans les 24h ouvrées
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-natural bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {isCareerApplication ? (
                    <>
                      <Briefcase className="w-6 h-6 text-primary" />
                      Candidature
                    </>
                  ) : (
                    t("contact.form.title")
                  )}
                </CardTitle>
                {isCareerApplication && (
                  <p className="text-muted-foreground">
                    Envoyez-nous votre candidature pour le poste : <strong>{careerSubject}</strong>
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <ContactForm 
                  source={isCareerApplication ? 'careers' : 'general'}
                  title={isCareerApplication ? 'Candidature' : t("contact.form.title")}
                  description={isCareerApplication ? 'Envoyez-nous votre candidature' : t("contact.form.description")}
                  prefillSubject={careerSubject}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-card/60 backdrop-blur-sm rounded-2xl p-12 border border-border/50">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            {t("contact.cta.title")}
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("contact.cta.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="nature" size="lg">
                {t("contact.cta.call")}
              </Button>
            </Link>
            <Button 
              variant="tech" 
              size="lg"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/brochure-akouma.pdf';
                link.download = 'AKOUMA-Brochure.pdf';
                link.click();
              }}
            >
              {t("contact.cta.download")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;