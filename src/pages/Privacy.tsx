import { Shield } from "lucide-react";
import { LegalPageContent } from "@/components/legal/LegalPageContent";

const Privacy = () => (
  <LegalPageContent
    slug="privacy"
    icon={Shield}
    fallbackTitle="Politique de Confidentialité"
    subtitle="Votre confiance est essentielle. Découvrez comment nous protégeons vos données."
    seoDescription="Votre confiance est essentielle. Découvrez comment KILIMO protège vos données personnelles."
    loadingText="Chargement de la politique de confidentialité..."
  />
);

export default Privacy;
