import { Landmark } from "lucide-react";
import { LegalPageContent } from "@/components/legal/LegalPageContent";

const Legal = () => (
  <LegalPageContent
    slug="legal"
    icon={Landmark}
    fallbackTitle="Mentions Légales"
    subtitle="Informations légales sur KILIMO et nos services."
    seoDescription="Informations légales sur KILIMO et nos services agricoles."
    loadingText="Chargement des mentions légales..."
  />
);

export default Legal;
