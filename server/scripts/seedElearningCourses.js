/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const courses = [
  {
    slug: 'maraichage-biologique-bases',
    title: 'Maraîchage biologique : les bases',
    description:
      "Apprenez les fondamentaux du maraîchage biologique : préparation du sol, rotation des cultures, compostage et lutte naturelle contre les nuisibles.",
    content:
      "Cette formation couvre les techniques essentielles pour démarrer un maraîchage biologique rentable : choix des espèces, calendrier de semis, fertilisation organique et gestion de l'eau.",
    price: 5000,
    duration: 90,
    level: 'Débutant',
    category: 'Agriculture',
    instructorName: 'Dr. Aïssata Koné',
    instructorBio: 'Agronome spécialisée en agriculture biologique, 12 ans d\'expérience en Afrique de l\'Ouest.',
    isPublished: true,
    languages: ['Français'],
    modules: [
      {
        title: 'Introduction au maraîchage biologique',
        type: 'text',
        duration: '20 min',
        order: 0,
        content:
          "Le maraîchage biologique repose sur trois piliers : la santé du sol, la biodiversité et l'absence d'intrants chimiques de synthèse. Dans ce module, nous verrons comment évaluer et préparer une parcelle avant la mise en culture.",
      },
      {
        title: 'Compostage et fertilisation organique',
        type: 'text',
        duration: '25 min',
        order: 1,
        content:
          "Le compost est la base de la fertilité en agriculture biologique. Nous détaillons les méthodes de compostage rapide, le ratio carbone/azote et les engrais verts adaptés à la zone soudano-sahélienne.",
      },
      {
        title: 'Test final : Maraîchage biologique',
        type: 'quiz',
        duration: '15 min',
        order: 2,
        quizQuestions: [
          {
            id: 'q1',
            question: "Quel est le principal objectif du maraîchage biologique ?",
            options: [
              'Maximiser le rendement à court terme avec des engrais chimiques',
              'Préserver la santé du sol et la biodiversité sans intrants de synthèse',
              'Utiliser uniquement des serres climatisées',
              'Réduire la main-d\'œuvre au strict minimum',
            ],
            correctAnswer: 1,
            explanation: "Le maraîchage biologique vise la fertilité durable du sol et la biodiversité, sans recours aux produits chimiques de synthèse.",
          },
          {
            id: 'q2',
            question: "Quel est le ratio carbone/azote (C/N) idéal pour un compost efficace ?",
            options: ['1/1', '5/1', '25-30/1', '100/1'],
            correctAnswer: 2,
            explanation: "Un ratio C/N de 25 à 30 pour 1 favorise une décomposition rapide et équilibrée de la matière organique.",
          },
          {
            id: 'q3',
            question: "Pourquoi pratique-t-on la rotation des cultures ?",
            options: [
              'Pour compliquer la planification',
              'Pour épuiser volontairement le sol',
              'Pour limiter l\'accumulation de ravageurs et préserver la fertilité',
              'Pour réduire la diversité des cultures',
            ],
            correctAnswer: 2,
            explanation: "La rotation casse les cycles des ravageurs et maladies spécifiques à une culture et équilibre les besoins en nutriments du sol.",
          },
          {
            id: 'q4',
            question: "Quel est un exemple d'engrais vert couramment utilisé ?",
            options: ['Le mucuna', 'Le sable', 'Le plastique biodégradable', 'Le ciment'],
            correctAnswer: 0,
            explanation: "Le mucuna est une légumineuse utilisée comme engrais vert pour fixer l'azote atmosphérique dans le sol.",
          },
          {
            id: 'q5',
            question: "Quelle pratique aide à lutter naturellement contre les nuisibles ?",
            options: [
              'La monoculture intensive',
              'Les pesticides de synthèse à large spectre',
              'Les associations de cultures et les auxiliaires naturels',
              'L\'arrosage excessif',
            ],
            correctAnswer: 2,
            explanation: "Les associations de cultures (ex. basilic-tomate) et la présence d'auxiliaires (coccinelles, oiseaux) limitent naturellement les ravageurs.",
          },
        ],
      },
    ],
  },
  {
    slug: 'irrigation-goutte-a-goutte',
    title: "Gestion de l'eau et irrigation goutte-à-goutte",
    description:
      "Maîtrisez l'installation et la gestion d'un système d'irrigation goutte-à-goutte pour économiser l'eau et améliorer vos rendements.",
    content:
      "Formation pratique sur le dimensionnement, l'installation et l'entretien des systèmes d'irrigation goutte-à-goutte adaptés aux exploitations familiales et semi-intensives.",
    price: 7000,
    duration: 100,
    level: 'Intermédiaire',
    category: 'Agriculture',
    instructorName: 'Ibrahim Ouédraogo',
    instructorBio: "Ingénieur en hydraulique agricole, spécialiste des systèmes d'irrigation à faible coût.",
    isPublished: true,
    languages: ['Français'],
    modules: [
      {
        title: "Principes de l'irrigation goutte-à-goutte",
        type: 'text',
        duration: '25 min',
        order: 0,
        content:
          "L'irrigation goutte-à-goutte apporte l'eau directement aux racines, réduisant l'évaporation et le gaspillage. Ce module présente les composants clés : réservoir, filtre, tuyaux et goutteurs.",
      },
      {
        title: 'Dimensionnement et installation',
        type: 'text',
        duration: '30 min',
        order: 1,
        content:
          "Nous verrons comment calculer les besoins en eau selon la culture et la surface, choisir l'espacement des goutteurs et installer le réseau sur le terrain.",
      },
      {
        title: 'Test final : Irrigation goutte-à-goutte',
        type: 'quiz',
        duration: '15 min',
        order: 2,
        quizQuestions: [
          {
            id: 'q1',
            question: "Quel est le principal avantage de l'irrigation goutte-à-goutte ?",
            options: [
              "Elle augmente l'évaporation de l'eau",
              "Elle réduit le gaspillage d'eau en ciblant les racines",
              'Elle nécessite plus de main-d\'œuvre que l\'arrosage manuel',
              'Elle ne fonctionne que sur de grandes surfaces',
            ],
            correctAnswer: 1,
            explanation: "En apportant l'eau directement à la zone racinaire, ce système limite fortement l'évaporation et le ruissellement.",
          },
          {
            id: 'q2',
            question: 'Quel composant empêche les goutteurs de se boucher ?',
            options: ['Le réservoir', 'Le filtre', 'Le goutteur', 'La pompe'],
            correctAnswer: 1,
            explanation: "Le filtre retient les particules en suspension dans l'eau qui pourraient obstruer les goutteurs.",
          },
          {
            id: 'q3',
            question: 'Quel facteur influence le calcul des besoins en eau ?',
            options: [
              "La couleur du réservoir",
              "Le type de culture et la surface à irriguer",
              'La marque du tuyau',
              "L'heure de la journée uniquement",
            ],
            correctAnswer: 1,
            explanation: "Les besoins en eau dépendent du type de culture, de son stade de croissance et de la surface cultivée.",
          },
          {
            id: 'q4',
            question: 'Quel est un signe fréquent de goutteur bouché ?',
            options: [
              'Une flaque immédiate sous chaque goutteur',
              'Un débit anormalement faible ou nul à un point du réseau',
              "Une augmentation de la pression dans tout le circuit",
              "Aucun signe, c'est indétectable",
            ],
            correctAnswer: 1,
            explanation: "Un débit faible ou nul à un point précis du réseau indique généralement un goutteur obstrué à cet endroit.",
          },
          {
            id: 'q5',
            question: "Quelle opération d'entretien prolonge la durée de vie du système ?",
            options: [
              'Ne jamais nettoyer le filtre',
              'Rincer régulièrement les tuyaux et nettoyer le filtre',
              "Laisser le système sous tension en permanence",
              'Retirer les goutteurs après chaque usage',
            ],
            correctAnswer: 1,
            explanation: "Le rinçage périodique des tuyaux et le nettoyage du filtre évitent l'accumulation de dépôts et prolongent la durée de vie du système.",
          },
        ],
      },
    ],
  },
  {
    slug: 'lutte-integree-ravageurs',
    title: 'Lutte intégrée contre les ravageurs et maladies',
    description:
      "Découvrez la lutte intégrée (IPM) : diagnostic des ravageurs et maladies, seuils d'intervention et méthodes de contrôle biologique et raisonné.",
    content:
      "Cette formation vous apprend à identifier les principaux ravageurs et maladies des cultures maraîchères et céréalières, et à choisir la méthode de lutte la plus adaptée et la moins nocive pour l'environnement.",
    price: 6000,
    duration: 80,
    level: 'Intermédiaire',
    category: 'Agriculture',
    instructorName: 'Dr. Fatou Diallo',
    instructorBio: 'Phytopathologiste, chercheuse en protection intégrée des cultures.',
    isPublished: true,
    languages: ['Français'],
    modules: [
      {
        title: 'Identifier les ravageurs et maladies courants',
        type: 'text',
        duration: '25 min',
        order: 0,
        content:
          "Ce module présente les principaux ravageurs (chenilles, pucerons, aleurodes) et maladies (mildiou, fusariose) rencontrés dans les cultures locales, avec leurs symptômes caractéristiques.",
      },
      {
        title: 'Seuils d\'intervention et méthodes de lutte',
        type: 'text',
        duration: '25 min',
        order: 1,
        content:
          "La lutte intégrée repose sur l'observation régulière et un seuil de nuisibilité avant toute intervention, en privilégiant les méthodes biologiques, culturales et mécaniques avant le recours chimique.",
      },
      {
        title: 'Test final : Lutte intégrée',
        type: 'quiz',
        duration: '15 min',
        order: 2,
        quizQuestions: [
          {
            id: 'q1',
            question: "Que signifie l'acronyme IPM (lutte intégrée) ?",
            options: [
              'Irrigation par pompage mécanique',
              'Gestion intégrée des ravageurs et maladies',
              'Institut de production maraîchère',
              'Indice de pression des marchés',
            ],
            correctAnswer: 1,
            explanation: "IPM (Integrated Pest Management) désigne la gestion intégrée des ravageurs, combinant plusieurs méthodes de lutte de manière raisonnée.",
          },
          {
            id: 'q2',
            question: "Qu'est-ce qu'un seuil d'intervention ?",
            options: [
              "Le moment où l'on doit arroser la culture",
              "Le niveau de population de ravageurs à partir duquel une action est justifiée économiquement",
              'La hauteur maximale des plants',
              'La quantité de compost à apporter',
            ],
            correctAnswer: 1,
            explanation: "Le seuil d'intervention est le niveau de présence d'un ravageur au-delà duquel les dégâts économiques justifient une action de lutte.",
          },
          {
            id: 'q3',
            question: 'Quelle méthode est privilégiée en priorité dans la lutte intégrée ?',
            options: [
              'Le traitement chimique systématique',
              'Les méthodes préventives, culturales et biologiques',
              "L'abandon de la parcelle",
              'Le brûlis systématique du champ',
            ],
            correctAnswer: 1,
            explanation: "La lutte intégrée privilégie d'abord la prévention et les méthodes biologiques/culturales avant d'envisager un traitement chimique ciblé en dernier recours.",
          },
          {
            id: 'q4',
            question: 'Le mildiou est principalement causé par :',
            options: ['Un insecte', 'Un champignon/oomycète favorisé par l\'humidité', 'Un manque d\'eau', 'Un excès de soleil'],
            correctAnswer: 1,
            explanation: "Le mildiou est une maladie causée par un oomycète qui se développe surtout en conditions humides.",
          },
          {
            id: 'q5',
            question: 'Quel est un exemple de lutte biologique contre les pucerons ?',
            options: [
              "L'introduction de coccinelles, prédateurs naturels des pucerons",
              "L'utilisation exclusive d'herbicides",
              'Le labour profond du sol',
              "L'arrêt total de l'arrosage",
            ],
            correctAnswer: 0,
            explanation: "Les coccinelles sont des prédateurs naturels efficaces contre les pucerons et constituent un moyen de lutte biologique.",
          },
        ],
      },
    ],
  },
  {
    slug: 'elevage-avicole-moderne',
    title: 'Élevage avicole moderne : démarrer son poulailler',
    description:
      "Guide complet pour démarrer un élevage de poulets de chair ou pondeuses : choix des races, alimentation, prophylaxie et gestion économique.",
    content:
      "Cette formation couvre les étapes clés pour lancer un élevage avicole rentable : construction du poulailler, alimentation équilibrée, calendrier de vaccination et suivi sanitaire.",
    price: 6500,
    duration: 95,
    level: 'Débutant',
    category: 'Élevage',
    instructorName: 'Moussa Traoré',
    instructorBio: 'Vétérinaire spécialisé en aviculture, formateur auprès de coopératives agricoles.',
    isPublished: true,
    languages: ['Français'],
    modules: [
      {
        title: 'Construire et équiper son poulailler',
        type: 'text',
        duration: '25 min',
        order: 0,
        content:
          "Un bon poulailler doit être bien ventilé, protégé des prédateurs et facile à nettoyer. Ce module détaille la densité d'élevage recommandée, les matériaux adaptés et l'équipement de base (mangeoires, abreuvoirs, éclairage).",
      },
      {
        title: 'Alimentation et prophylaxie',
        type: 'text',
        duration: '25 min',
        order: 1,
        content:
          "Une alimentation équilibrée selon l'âge et le type d'élevage (chair ou ponte) est essentielle. Nous abordons également le calendrier de vaccination et les mesures d'hygiène pour prévenir les maladies courantes.",
      },
      {
        title: 'Test final : Élevage avicole',
        type: 'quiz',
        duration: '15 min',
        order: 2,
        quizQuestions: [
          {
            id: 'q1',
            question: "Pourquoi la ventilation du poulailler est-elle importante ?",
            options: [
              "Elle n'a aucun impact sur la santé des volailles",
              'Elle limite l\'humidité et l\'accumulation de gaz nocifs (ammoniac)',
              'Elle sert uniquement à refroidir les œufs',
              'Elle remplace l\'alimentation',
            ],
            correctAnswer: 1,
            explanation: "Une bonne ventilation réduit l'humidité et évacue l'ammoniac produit par les fientes, prévenant les maladies respiratoires.",
          },
          {
            id: 'q2',
            question: "Quel facteur détermine principalement le type d'aliment à donner aux poulets ?",
            options: [
              'La couleur des plumes',
              "L'âge et l'objectif d'élevage (chair ou ponte)",
              'La météo du jour',
              'Le prix du marché uniquement',
            ],
            correctAnswer: 1,
            explanation: "Les besoins nutritionnels varient selon l'âge de la volaille et sa finalité (production de viande ou d'œufs).",
          },
          {
            id: 'q3',
            question: "Que permet un calendrier de vaccination bien suivi ?",
            options: [
              "D'augmenter artificiellement le poids des poulets",
              'De prévenir les épidémies et réduire la mortalité',
              "De remplacer l'alimentation",
              "De supprimer le besoin d'eau",
            ],
            correctAnswer: 1,
            explanation: "Un calendrier de vaccination adapté protège le cheptel contre les principales maladies aviaires et réduit les pertes.",
          },
          {
            id: 'q4',
            question: "Quelle densité d'élevage est généralement recommandée pour éviter le stress des volailles ?",
            options: [
              'Le plus grand nombre possible par mètre carré',
              'Une densité adaptée à l\'espace disponible selon les normes zootechniques',
              'Une seule volaille par poulailler',
              "La densité n'a aucune importance",
            ],
            correctAnswer: 1,
            explanation: "Respecter une densité adaptée réduit le stress, les blessures et la propagation des maladies entre volailles.",
          },
          {
            id: 'q5',
            question: 'Quel élément est essentiel pour la prophylaxie en aviculture ?',
            options: [
              "L'hygiène régulière du poulailler et de l'équipement",
              "L'absence totale de nettoyage",
              'Le partage d\'abreuvoirs avec d\'autres animaux sans nettoyage',
              "L'obscurité permanente",
            ],
            correctAnswer: 0,
            explanation: "Le nettoyage et la désinfection réguliers du poulailler et des équipements limitent la propagation des agents pathogènes.",
          },
        ],
      },
    ],
  },
];

async function seedElearningCourses() {
  console.log('📚 Création de 4 formations e-learning avec tests...\n');

  for (const courseData of courses) {
    const { modules, ...courseFields } = courseData;

    const course = await prisma.course.upsert({
      where: { slug: courseFields.slug },
      create: courseFields,
      update: courseFields,
    });

    console.log(`✅ Formation : ${course.title} (id=${course.id}, slug=${course.slug})`);

    // Remove existing modules for idempotency, then recreate them
    await prisma.courseModule.deleteMany({ where: { courseId: course.id } });

    for (const moduleData of modules) {
      const created = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: moduleData.title,
          type: moduleData.type,
          duration: moduleData.duration,
          content: moduleData.content || null,
          order: moduleData.order,
          isActive: true,
          quizQuestions: moduleData.quizQuestions || undefined,
        },
      });
      console.log(`   ↳ Module : ${created.title} (${created.type})`);
    }

    console.log('');
  }

  console.log('🎉 4 formations e-learning créées avec succès, chacune avec un test final.');
}

seedElearningCourses()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des formations e-learning:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
