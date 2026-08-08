import { ScrollText } from "lucide-react";
import { LegalPageContent } from "@/components/legal/LegalPageContent";

const Terms = () => (
  <LegalPageContent
    slug="terms"
    icon={ScrollText}
    fallbackTitle="Conditions d'Utilisation"
    subtitle="Les règles qui régissent l'utilisation de nos services agricoles technologiques."
    seoDescription="Les règles qui régissent l'utilisation des services agricoles technologiques de KILIMO."
    loadingText="Chargement des conditions d'utilisation..."
  />
);

export default Terms;
