import { MapPin, Phone, Mail, Clock, Briefcase } from "lucide-react";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { useI18n } from "@/i18n";
import { useContactSettings } from "@/hooks/use-contact-settings";

interface ContactAppViewProps {
  isCareerApplication?: boolean;
  careerSubject?: string;
}

export function ContactAppView({ isCareerApplication, careerSubject }: ContactAppViewProps) {
  const { t } = useI18n();
  const { data: contact } = useContactSettings();

  const infos = [
    { icon: MapPin, label: contact?.city || t("contact.address.city"), sub: contact?.addressLine1 || t("contact.address.zone") },
    { icon: Phone, label: contact?.phone || "+237 233 XX XX XX", sub: contact?.whatsappNumber || "+237 6XX XX XX XX" },
    { icon: Mail, label: contact?.email || "contact@KILIMO.cm" },
    { icon: Clock, label: t("contact.hours.week"), sub: t("contact.hours.sat") },
  ];

  return (
    <div className="pb-8">
      <AppPageHeader title={t("contact.title")} backTo="/menu" subtitle={t("contact.subtitle")} />

      <div className="px-4 pt-4 space-y-6">
        <div className="grid grid-cols-2 gap-2.5">
          {infos.map((info, i) => (
            <div key={i} className="rounded-2xl border border-border/60 p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <info.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{info.label}</p>
                {info.sub && <p className="text-xs text-muted-foreground truncate">{info.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 p-4">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            {isCareerApplication ? (
              <><Briefcase className="w-4 h-4 text-primary" /> Candidature</>
            ) : (
              t("contact.form.title")
            )}
          </h2>
          {isCareerApplication && (
            <p className="text-sm text-muted-foreground mb-3">
              Poste : <strong>{careerSubject}</strong>
            </p>
          )}
          <ContactForm
            source={isCareerApplication ? "careers" : "general"}
            title={isCareerApplication ? "Candidature" : t("contact.form.title")}
            description={isCareerApplication ? "Envoyez-nous votre candidature" : t("contact.form.description")}
            prefillSubject={careerSubject}
          />
        </div>
      </div>
    </div>
  );
}

export default ContactAppView;
