/* eslint-disable no-console */
// Pages légales de base (Politique de confidentialité, CGU, Mentions
// légales). Les informations d'identité juridique (forme sociale, RCCM,
// siège social, hébergeur) ne sont pas connues à ce stade et sont donc
// laissées en placeholder explicite "[À compléter]" plutôt qu'inventées —
// à corriger via Admin → Pages Légales avant mise en production réelle.
// "Gérer les cookies" n'a pas besoin d'entrée ici : cette page est statique
// (voir src/pages/Cookies.tsx), elle ne lit pas la table LegalPage.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const pages = [
  {
    slug: 'privacy',
    title: 'Politique de Confidentialité',
    type: 'legal',
    version: '1.0',
    content: `
      <h2>1. Responsable du traitement</h2>
      <p>KILIMO Agritech (« KILIMO », « nous ») est responsable du traitement des données personnelles collectées via ce site.
      Contact : <a href="mailto:contact@kilimo.cm">contact@kilimo.cm</a> — Siège social : [Adresse à compléter].</p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Données de compte : nom, email, mot de passe (chiffré), pays</li>
        <li>Données de commande et de livraison (boutique, semences)</li>
        <li>Données de paiement traitées par notre prestataire de paiement (MoneyFusion) — nous ne stockons pas vos coordonnées bancaires</li>
        <li>Données de don (nom, email, montant, message optionnel)</li>
        <li>Messages envoyés via les formulaires de contact et de partenariat</li>
        <li>Données de navigation et cookies (voir notre page « Gérer les cookies »)</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont utilisées pour : fournir et gérer votre compte et vos commandes, traiter les paiements et livraisons,
      délivrer les formations et certificats e-learning, répondre à vos demandes, améliorer nos services, et vous informer
      (newsletter, sur consentement).</p>

      <h2>4. Base légale</h2>
      <p>Exécution du contrat (compte, commandes, formations), consentement (newsletter, cookies non essentiels) et intérêt
      légitime (sécurité, amélioration du service).</p>

      <h2>5. Durée de conservation</h2>
      <p>Vos données sont conservées pendant la durée de la relation contractuelle, puis archivées conformément aux
      obligations légales applicables (comptables, fiscales).</p>

      <h2>6. Destinataires des données</h2>
      <p>Vos données peuvent être partagées avec nos prestataires strictement nécessaires à la fourniture du service :
      prestataire de paiement, partenaire de livraison, prestataire d'envoi d'emails, hébergeur. Ces prestataires sont
      contractuellement tenus de protéger vos données.</p>

      <h2>7. Vos droits</h2>
      <p>Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification, d'effacement,
      d'opposition et de portabilité de vos données. Pour exercer ces droits, contactez-nous à
      <a href="mailto:contact@kilimo.cm">contact@kilimo.cm</a>.</p>

      <h2>8. Sécurité</h2>
      <p>Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données contre
      tout accès non autorisé, perte ou divulgation.</p>

      <h2>9. Modifications</h2>
      <p>Cette politique peut être mise à jour. La date de dernière mise à jour est indiquée en haut de cette page.</p>
    `.trim(),
  },
  {
    slug: 'terms',
    title: "Conditions Générales d'Utilisation",
    type: 'legal',
    version: '1.0',
    content: `
      <h2>1. Objet</h2>
      <p>Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme KILIMO :
      formations e-learning, boutique de semences et d'équipements agricoles, module de dons et assistant conversationnel.</p>

      <h2>2. Acceptation</h2>
      <p>En créant un compte ou en utilisant nos services, vous acceptez sans réserve les présentes CGU.</p>

      <h2>3. Compte utilisateur</h2>
      <p>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.
      Toute information fournie doit être exacte et à jour.</p>

      <h2>4. Commandes et paiement</h2>
      <p>Les prix affichés sont exprimés dans la devise indiquée sur le site. Le paiement est traité par notre prestataire
      de paiement partenaire. Une commande n'est confirmée qu'après validation du paiement.</p>

      <h2>5. Livraison</h2>
      <p>Les délais et frais de livraison sont indiqués lors de la commande et peuvent varier selon la localisation et le
      partenaire logistique en charge de l'acheminement.</p>

      <h2>6. Formations en ligne</h2>
      <p>L'accès aux formations est personnel et non transférable. Les certificats délivrés attestent de la complétion du
      parcours de formation selon les modalités définies pour chaque cours.</p>

      <h2>7. Dons</h2>
      <p>Les dons effectués via la plateforme sont des contributions volontaires. KILIMO ne garantit aucun rendement
      financier ni traitement fiscal particulier au titre des dons reçus.</p>

      <h2>8. Propriété intellectuelle</h2>
      <p>Les contenus du site (textes, formations, logos, visuels) sont protégés par le droit de la propriété intellectuelle.
      Toute reproduction non autorisée est interdite.</p>

      <h2>9. Responsabilité</h2>
      <p>KILIMO met tout en œuvre pour assurer la disponibilité et l'exactitude des informations du site, sans garantir
      une disponibilité continue ni l'absence d'erreurs.</p>

      <h2>10. Résiliation</h2>
      <p>Vous pouvez supprimer votre compte à tout moment. KILIMO se réserve le droit de suspendre un compte en cas de
      violation des présentes CGU.</p>

      <h2>11. Droit applicable</h2>
      <p>Les présentes CGU sont soumises au droit applicable au siège social de KILIMO. Tout litige relève des juridictions
      compétentes de ce ressort.</p>

      <h2>12. Contact</h2>
      <p>Pour toute question relative aux présentes CGU : <a href="mailto:contact@kilimo.cm">contact@kilimo.cm</a>.</p>
    `.trim(),
  },
  {
    slug: 'legal',
    title: 'Mentions Légales',
    type: 'legal',
    version: '1.0',
    content: `
      <h2>Éditeur du site</h2>
      <p>
        Raison sociale : KILIMO Agritech [Forme juridique à compléter]<br/>
        Siège social : [Adresse à compléter]<br/>
        Registre du commerce (RCCM) : [À compléter]<br/>
        Capital social : [À compléter]<br/>
        Email : <a href="mailto:contact@kilimo.cm">contact@kilimo.cm</a>
      </p>

      <h2>Directeur de la publication</h2>
      <p>[Nom du responsable de publication à compléter]</p>

      <h2>Hébergement</h2>
      <p>[Nom et adresse de l'hébergeur à compléter]</p>

      <h2>Propriété intellectuelle</h2>
      <p>L'ensemble des éléments présents sur ce site (textes, images, logos, structure) est protégé par le droit d'auteur
      et le droit des marques. Toute reproduction, même partielle, est soumise à autorisation préalable.</p>

      <h2>Liens hypertextes</h2>
      <p>Ce site peut contenir des liens vers des sites tiers. KILIMO n'exerce aucun contrôle sur ces sites et décline
      toute responsabilité quant à leur contenu.</p>

      <h2>Droit applicable</h2>
      <p>Les présentes mentions légales sont régies par le droit applicable au siège social de l'éditeur.</p>
    `.trim(),
  },
];

async function seedLegalPages() {
  console.log(`⚖️  Création de ${pages.length} pages légales...\n`);

  for (const data of pages) {
    const page = await prisma.legalPage.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    console.log(`✅ Page légale : ${page.title} (id=${page.id}, slug=${page.slug})`);
  }

  console.log(`\n🎉 ${pages.length} pages légales créées. Complète les [placeholders] via Admin → Pages Légales avant mise en production réelle.`);
}

seedLegalPages()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des pages légales :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
