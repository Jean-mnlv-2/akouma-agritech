/* eslint-disable no-console */
// Peuple des données réalistes pour tous les onglets admin "E-Learning &
// Certifications" (Inscriptions, Aperçus, Présences, Rattrapages,
// Suggestions DeerFlow, Journal Rappels, Certificats) au-dessus des 4
// formations déjà créées par seedElearningCourses.js. Idempotent : les
// données précédemment créées par ce script sont supprimées (par email de
// test / courseId connu) avant recréation.
//
// Volontairement AUCUN identifiant Sertifier (design/detail/emailTemplate)
// n'est renseigné sur les cours : la file d'émission de certificats ne se
// déclenche que sur les lignes 'pending', et sans ID Sertifier valide toute
// tentative échoue immédiatement sans appeler l'API Sertifier réelle. Voir
// server/src/routes/certificates.ts.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NOW = new Date();
const days = (n) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

const LEARNERS = [
  {
    email: 'amina.diallo@example.com',
    fullName: 'Aminata Diallo',
    phone: '+221770000001',
    professionalActivity: 'Agricultrice indépendante',
    organization: 'Coopérative Sooretul',
    sector: 'Maraîchage',
    experienceLevel: 'Intermédiaire',
    expectations: 'Améliorer mes rendements en maraîchage biologique et obtenir une certification reconnue.',
  },
  {
    email: 'boubacar.sana@example.com',
    fullName: 'Boubacar Sana',
    phone: '+221770000002',
    professionalActivity: 'Technicien agricole',
    organization: 'Direction Régionale de l\'Agriculture',
    sector: 'Irrigation',
    experienceLevel: 'Avancé',
    expectations: 'Me perfectionner sur les systèmes d\'irrigation à faible coût pour conseiller les producteurs.',
  },
  {
    email: 'chantal.yao@example.com',
    fullName: 'Chantal Yao',
    phone: '+225070000003',
    professionalActivity: 'Entrepreneure agricole',
    organization: 'Ferme Yao & Fils',
    sector: 'Cultures maraîchères',
    experienceLevel: 'Débutant',
    expectations: 'Sécuriser mes cultures contre les ravageurs sans recourir aux pesticides chimiques.',
  },
  {
    email: 'david.kouassi@example.com',
    fullName: 'David Kouassi',
    phone: '+225070000004',
    professionalActivity: 'Éleveur',
    organization: 'Ferme avicole Kouassi',
    sector: 'Aviculture',
    experienceLevel: 'Intermédiaire',
    expectations: 'Structurer mon élevage avicole et réduire la mortalité de mon cheptel.',
  },
  {
    email: 'fatoumata.cisse@example.com',
    fullName: 'Fatoumata Cissé',
    phone: '+223070000005',
    professionalActivity: 'Conseillère agricole',
    organization: 'ONG AgriFuture',
    sector: 'Agriculture familiale',
    experienceLevel: 'Avancé',
    expectations: 'Actualiser mes connaissances pour mieux accompagner les producteurs que je conseille.',
  },
  {
    email: 'emmanuel.nguessan@example.com',
    fullName: "Emmanuel N'Guessan",
    phone: '+225070000006',
    professionalActivity: 'Étudiant en agronomie',
    organization: 'Université Félix Houphouët-Boigny',
    sector: 'Formation',
    experienceLevel: 'Débutant',
    expectations: "Compléter ma formation académique par des compétences pratiques de terrain.",
  },
];

const PREVIEW_ITEMS_BY_SLUG = {
  'maraichage-biologique-bases': [
    { typeName: 'video', title: 'Visite guidée : préparer une parcelle bio', description: "Aperçu des étapes clés pour évaluer et préparer une parcelle avant la mise en culture biologique.", contentUrl: 'https://example.com/media/maraichage-preview.mp4', duration: '3 min', order: 0, isActive: true },
    { typeName: 'pdf', title: 'Fiche technique : ratio carbone/azote du compost', description: "Extrait de la fiche pratique sur le dosage du compost distribuée dans le module 2.", contentUrl: 'https://example.com/media/maraichage-fiche-compost.pdf', duration: null, order: 1, isActive: true },
  ],
  'irrigation-goutte-a-goutte': [
    { typeName: 'video', title: 'Démonstration : installation goutte-à-goutte', description: "Extrait vidéo de l'installation d'un réseau goutte-à-goutte sur une parcelle familiale.", contentUrl: 'https://example.com/media/irrigation-preview.mp4', duration: '4 min', order: 0, isActive: true },
    // Volontairement inactif : exerce le badge/switch "Inactif" et la route
    // GET /api/course_preview_items/admin (seule vue qui les liste encore).
    { typeName: 'audio', title: "Podcast : témoignage d'un maraîcher équipé", description: "Un producteur revient sur les économies d'eau réalisées après l'installation du système.", contentUrl: 'https://example.com/media/irrigation-podcast.mp3', duration: '12 min', order: 1, isActive: false },
  ],
  'lutte-integree-ravageurs': [
    { typeName: 'pdf', title: 'Checklist : identifier les ravageurs courants', description: "Grille d'identification rapide utilisée dans le module 1.", contentUrl: 'https://example.com/media/lutte-checklist.pdf', duration: null, order: 0, isActive: true },
    { typeName: 'video', title: 'Aperçu : auxiliaires naturels au jardin', description: "Courte vidéo illustrant l'action des coccinelles contre les pucerons.", contentUrl: 'https://example.com/media/lutte-preview.mp4', duration: '5 min', order: 1, isActive: true },
  ],
  'elevage-avicole-moderne': [
    { typeName: 'video', title: "Visite d'un poulailler moderne", description: 'Aménagement, densité et équipement de base présentés dans le module 1.', contentUrl: 'https://example.com/media/elevage-preview.mp4', duration: '4 min', order: 0, isActive: true },
    { typeName: 'pdf', title: 'Calendrier de vaccination avicole', description: 'Extrait du calendrier de prophylaxie détaillé dans le module 2.', contentUrl: 'https://example.com/media/elevage-vaccination.pdf', duration: null, order: 1, isActive: true },
  ],
};

function genCertNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KLM-CERT-${ts}-${rand}`;
}

async function main() {
  console.log('🌱 Peuplement des données admin E-Learning & Certifications...\n');

  // --- Nettoyage idempotent -------------------------------------------------
  await prisma.user.deleteMany({ where: { email: { in: LEARNERS.map((l) => l.email) } } });
  const courses = {};
  for (const slug of Object.keys(PREVIEW_ITEMS_BY_SLUG)) {
    const course = await prisma.course.findUnique({ where: { slug }, include: { modules: { orderBy: { order: 'asc' } } } });
    if (!course) throw new Error(`Cours introuvable: ${slug}. Lancez d'abord seedElearningCourses.js`);
    courses[slug] = course;
  }
  await prisma.coursePreviewItem.deleteMany({ where: { courseId: { in: Object.values(courses).map((c) => c.id) } } });
  await prisma.aiSuggestion.deleteMany({});

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) throw new Error('Aucun compte admin trouvé.');

  const previewTypes = await prisma.coursePreviewType.findMany();
  const typeIdByName = Object.fromEntries(previewTypes.map((t) => [t.name, t.id]));

  // --- Utilisateurs apprenants ----------------------------------------------
  const passwordHash = await bcrypt.hash('Test1234!', 12);
  const users = {};
  for (const learner of LEARNERS) {
    const user = await prisma.user.create({
      data: {
        email: learner.email,
        passwordHash,
        fullName: learner.fullName,
        phone: learner.phone,
        role: 'customer',
        isActive: true,
      },
    });
    users[learner.email] = { ...user, profile: learner };
    console.log(`✅ Apprenant : ${user.fullName} (${user.email})`);
  }

  // --- Cohorte : lutte-integree-ravageurs passe en progression de cohorte ---
  await prisma.course.update({
    where: { id: courses['lutte-integree-ravageurs'].id },
    data: { cohortStartDate: days(-37), cohortIntervalDays: 7 },
  });
  console.log('\n✅ Cohorte configurée sur "Lutte intégrée contre les ravageurs et maladies" (début -37j, +7j/module)\n');

  // --- Aperçus (CoursePreviewItem) ------------------------------------------
  for (const [slug, items] of Object.entries(PREVIEW_ITEMS_BY_SLUG)) {
    const course = courses[slug];
    for (const item of items) {
      await prisma.coursePreviewItem.create({
        data: {
          courseId: course.id,
          typeId: typeIdByName[item.typeName],
          type: item.typeName,
          title: item.title,
          description: item.description,
          contentUrl: item.contentUrl,
          duration: item.duration,
          order: item.order,
          isActive: item.isActive,
        },
      });
    }
    console.log(`✅ Aperçus créés pour ${course.title} (${items.length})`);
  }
  console.log('');

  // --- Inscriptions + progression modules -----------------------------------
  async function enroll({ email, slug, studyPace, studyDays, dailyTimeSlot, enrolledAt, startDate, targetEndDate, moduleCompletions, completedAt, remindersEnabled = true }) {
    const user = users[email];
    const course = courses[slug];
    const modules = course.modules;
    const totalModules = modules.length;
    const completedCount = moduleCompletions.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / totalModules) * 100);

    const enrollment = await prisma.eLearningEnrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        enrolledAt,
        startDate,
        targetEndDate,
        completedAt: completedAt || null,
        progress,
        studyPace,
        studyDays: JSON.stringify(studyDays),
        dailyTimeSlot,
        professionalActivity: user.profile.professionalActivity,
        organization: user.profile.organization,
        sector: user.profile.sector,
        experienceLevel: user.profile.experienceLevel,
        expectations: user.profile.expectations,
        remindersEnabled,
        lastReminderSent: remindersEnabled ? days(-2) : null,
      },
    });

    for (let i = 0; i < moduleCompletions.length; i++) {
      const mc = moduleCompletions[i];
      const module = modules[i];
      await prisma.moduleProgress.create({
        data: {
          enrollmentId: enrollment.id,
          moduleId: module.id,
          userId: user.id,
          completed: mc.completed,
          quizScore: mc.quizScore ?? null,
          completedAt: mc.completed ? (mc.completedAt || enrolledAt) : null,
          videoPositionSec: mc.completed ? 0 : 45,
          pdfPage: 1,
        },
      });
    }

    console.log(`✅ Inscription : ${user.fullName} → ${course.title} (${progress}%)`);
    return { enrollment, course, user, quizModuleId: modules[2].id };
  }

  const e1 = await enroll({
    email: 'amina.diallo@example.com', slug: 'maraichage-biologique-bases',
    studyPace: 'intensif', studyDays: ['Lundi', 'Mercredi', 'Vendredi'], dailyTimeSlot: '18h00 - 19h30',
    enrolledAt: days(-35), startDate: days(-35), targetEndDate: days(-7), completedAt: days(-5),
    remindersEnabled: false,
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: true, quizScore: 96, completedAt: days(-5) }],
  });

  const e2 = await enroll({
    email: 'amina.diallo@example.com', slug: 'irrigation-goutte-a-goutte',
    studyPace: 'standard', studyDays: ['Mardi', 'Jeudi'], dailyTimeSlot: '12h00 - 13h00',
    enrolledAt: days(-2), startDate: days(3), targetEndDate: days(30),
    moduleCompletions: [{ completed: false }, { completed: false }, { completed: false }],
  });

  const e3 = await enroll({
    email: 'boubacar.sana@example.com', slug: 'irrigation-goutte-a-goutte',
    studyPace: 'standard', studyDays: ['Lundi', 'Mercredi', 'Vendredi'], dailyTimeSlot: '09h00 - 11h00',
    enrolledAt: days(-20), startDate: days(-20), targetEndDate: days(10),
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: false }],
  });

  const e4 = await enroll({
    email: 'boubacar.sana@example.com', slug: 'lutte-integree-ravageurs',
    studyPace: 'flexible', studyDays: ['Samedi'], dailyTimeSlot: '10h00 - 12h00',
    enrolledAt: days(-30), startDate: days(-30), targetEndDate: days(5),
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: false }],
  });

  const e5 = await enroll({
    email: 'chantal.yao@example.com', slug: 'lutte-integree-ravageurs',
    studyPace: 'flexible', studyDays: ['Mardi', 'Jeudi'], dailyTimeSlot: '14h00 - 16h00',
    enrolledAt: days(-36), startDate: days(-36), targetEndDate: days(-1),
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: false }],
  });

  const e6 = await enroll({
    email: 'chantal.yao@example.com', slug: 'maraichage-biologique-bases',
    studyPace: 'intensif', studyDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi'], dailyTimeSlot: '07h00 - 08h00',
    enrolledAt: days(-25), startDate: days(-25), targetEndDate: days(-3), completedAt: days(-3),
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: true, quizScore: 88, completedAt: days(-3) }],
  });

  const e7 = await enroll({
    email: 'david.kouassi@example.com', slug: 'elevage-avicole-moderne',
    studyPace: 'intensif', studyDays: ['Lundi', 'Mercredi', 'Vendredi'], dailyTimeSlot: '19h00 - 20h30',
    enrolledAt: days(-40), startDate: days(-40), targetEndDate: days(-10), completedAt: days(-10),
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: true, quizScore: 55, completedAt: days(-10) }],
  });

  const e8 = await enroll({
    email: 'david.kouassi@example.com', slug: 'maraichage-biologique-bases',
    studyPace: 'standard', studyDays: ['Dimanche'], dailyTimeSlot: '08h00 - 09h00',
    enrolledAt: days(-8), startDate: days(-8), targetEndDate: days(20),
    moduleCompletions: [{ completed: true }, { completed: false }, { completed: false }],
  });

  const e9 = await enroll({
    email: 'fatoumata.cisse@example.com', slug: 'maraichage-biologique-bases',
    studyPace: 'standard', studyDays: ['Lundi', 'Vendredi'], dailyTimeSlot: '13h00 - 14h00',
    enrolledAt: days(-18), startDate: days(-18), targetEndDate: days(15),
    moduleCompletions: [{ completed: true }, { completed: false }, { completed: false }],
  });

  const e10 = await enroll({
    email: 'fatoumata.cisse@example.com', slug: 'lutte-integree-ravageurs',
    studyPace: 'intensif', studyDays: ['Lundi', 'Mercredi'], dailyTimeSlot: '15h00 - 17h00',
    enrolledAt: days(-36), startDate: days(-36), targetEndDate: days(-14), completedAt: days(-14),
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: true, quizScore: 72, completedAt: days(-14) }],
  });

  const e11 = await enroll({
    email: 'emmanuel.nguessan@example.com', slug: 'elevage-avicole-moderne',
    studyPace: 'flexible', studyDays: ['Samedi', 'Dimanche'], dailyTimeSlot: '16h00 - 18h00',
    enrolledAt: days(-25), startDate: days(-25), targetEndDate: days(5),
    moduleCompletions: [{ completed: false }, { completed: false }, { completed: false }],
  });

  const e12 = await enroll({
    email: 'emmanuel.nguessan@example.com', slug: 'lutte-integree-ravageurs',
    studyPace: 'standard', studyDays: ['Mardi'], dailyTimeSlot: '11h00 - 13h00',
    enrolledAt: days(-34), startDate: days(-34), targetEndDate: days(-9),
    moduleCompletions: [{ completed: true }, { completed: true }, { completed: false }],
  });

  console.log('');

  // --- Présences (CourseSchedule) -------------------------------------------
  async function schedule(enr, entries) {
    let absenceCount = 0;
    for (const entry of entries) {
      if (entry.status === 'absent') absenceCount += 1;
      await prisma.courseSchedule.create({
        data: {
          enrollmentId: enr.enrollment.id,
          userId: enr.user.id,
          courseId: enr.course.id,
          scheduledDate: entry.date,
          timeSlot: entry.timeSlot,
          status: entry.status,
          isLocked: true,
          attendedAt: entry.status === 'attended' ? entry.date : null,
          absenceCount,
        },
      });
    }
    console.log(`✅ Présences : ${enr.user.fullName} → ${enr.course.title} (${entries.length} séances)`);
  }

  await schedule(e3, [
    { date: days(-10), timeSlot: '09h00 - 11h00', status: 'attended' },
    { date: days(7), timeSlot: '09h00 - 11h00', status: 'scheduled' },
  ]);
  await schedule(e4, [
    { date: days(-30), timeSlot: '10h00 - 12h00', status: 'attended' },
    { date: days(-23), timeSlot: '10h00 - 12h00', status: 'attended' },
  ]);
  await schedule(e5, [
    { date: days(-30), timeSlot: '14h00 - 16h00', status: 'absent' },
    { date: days(-23), timeSlot: '14h00 - 16h00', status: 'absent' },
    { date: days(-16), timeSlot: '14h00 - 16h00', status: 'absent' },
  ]);
  await schedule(e10, [
    { date: days(-30), timeSlot: '15h00 - 17h00', status: 'attended' },
    { date: days(-23), timeSlot: '15h00 - 17h00', status: 'attended' },
    { date: days(-16), timeSlot: '15h00 - 17h00', status: 'attended' },
  ]);
  await schedule(e11, [
    { date: days(-25), timeSlot: '16h00 - 18h00', status: 'absent' },
    { date: days(-18), timeSlot: '16h00 - 18h00', status: 'absent' },
    { date: days(-11), timeSlot: '16h00 - 18h00', status: 'absent' },
    { date: days(-4), timeSlot: '16h00 - 18h00', status: 'absent' },
  ]);
  console.log('');

  // --- Rattrapages (RattrapageRequest) --------------------------------------
  const r1 = await prisma.rattrapageRequest.create({
    data: {
      enrollmentId: e5.enrollment.id,
      moduleId: e5.quizModuleId,
      userId: e5.user.id,
      courseId: e5.course.id,
      status: 'pending',
      requestedAt: days(-15),
      suggestedByAi: true,
      suggestedResolution: "Proposer une évaluation orale de rattrapage avant le 15/08/2026, compte tenu des trois absences déjà enregistrées.",
    },
  });
  const r2 = await prisma.rattrapageRequest.create({
    data: {
      enrollmentId: e10.enrollment.id,
      moduleId: e10.quizModuleId,
      userId: e10.user.id,
      courseId: e10.course.id,
      status: 'granted',
      requestedAt: days(-22),
      resolvedAt: days(-15),
      resolvedBy: admin.id,
      resolutionNote: 'Rattrapage accordé : nouvelle session le 20/08/2026, réussie avec 72/100.',
    },
  });
  const r3 = await prisma.rattrapageRequest.create({
    data: {
      enrollmentId: e12.enrollment.id,
      moduleId: e12.quizModuleId,
      userId: e12.user.id,
      courseId: e12.course.id,
      status: 'rejected',
      requestedAt: days(-8),
      resolvedAt: days(-5),
      resolvedBy: admin.id,
      resolutionNote: "Délai de plus de 60 jours depuis la clôture du module : veuillez vous réinscrire à la session suivante.",
    },
  });
  console.log(`✅ Rattrapages créés : pending=${r1.id}, granted=${r2.id}, rejected=${r3.id}\n`);

  // --- Suggestions DeerFlow (AiSuggestion) ----------------------------------
  const quizModuleIrrigation = courses['irrigation-goutte-a-goutte'].modules[2].id;
  const quizModuleElevage = courses['elevage-avicole-moderne'].modules[2].id;

  await prisma.aiSuggestion.create({
    data: {
      type: 'attendance_outreach', targetType: 'enrollment', targetId: e11.enrollment.id,
      title: "Relance présence — Emmanuel N'Guessan (Élevage avicole moderne)",
      payload: { subject: 'On continue ensemble ?', message: "Bonjour Emmanuel, nous avons remarqué plusieurs absences aux séances d'Élevage avicole moderne. Un conseiller peut vous aider à reprendre un rythme adapté — répondez à ce message pour planifier un rattrapage." },
      status: 'applied', reviewedBy: admin.id, reviewedAt: days(-3),
    },
  });
  await prisma.aiSuggestion.create({
    data: {
      type: 'attendance_outreach', targetType: 'enrollment', targetId: e5.enrollment.id,
      title: 'Relance présence — Chantal Yao (Lutte intégrée)',
      payload: { subject: 'Ne perdez pas le fil de votre formation', message: 'Bonjour Chantal, trois séances ont été manquées sur "Lutte intégrée contre les ravageurs et maladies". Souhaitez-vous un créneau de rattrapage cette semaine ?' },
      status: 'pending',
    },
  });
  await prisma.aiSuggestion.create({
    data: {
      type: 'quiz_review', targetType: 'module', targetId: quizModuleIrrigation,
      title: 'Révision suggérée — Test final Irrigation goutte-à-goutte',
      payload: {
        quizQuestions: [
          { id: 'q2', question: 'Quel composant filtre les particules pour éviter que les goutteurs ne se bouchent ?', options: ['Le réservoir', 'Le filtre', 'Le goutteur', 'La pompe'], correctAnswer: 1, explanation: "Le filtre retient les particules en suspension avant qu'elles n'atteignent les goutteurs, réduisant les obstructions." },
        ],
      },
      status: 'pending',
    },
  });
  await prisma.aiSuggestion.create({
    data: {
      type: 'quiz_review', targetType: 'module', targetId: quizModuleElevage,
      title: 'Révision suggérée — Test final Élevage avicole',
      payload: { quizQuestions: [{ id: 'q1', question: 'Pourquoi la ventilation du poulailler est-elle importante ? (reformulation proposée)', options: ["Elle n'a aucun impact", "Elle limite l'humidité et l'ammoniac", 'Elle refroidit les œufs', "Elle remplace l'alimentation"], correctAnswer: 1, explanation: "Formulation jugée déjà claire par l'équipe pédagogique." }] },
      status: 'dismissed', reviewedBy: admin.id, reviewedAt: days(-6),
    },
  });
  await prisma.aiSuggestion.create({
    data: {
      type: 'cohort_schedule', targetType: 'course', targetId: courses['irrigation-goutte-a-goutte'].id,
      title: 'Passage en cohorte suggéré — Irrigation goutte-à-goutte',
      payload: { cohortStartDate: '2026-08-20', cohortIntervalDays: 7 },
      status: 'pending',
    },
  });
  await prisma.aiSuggestion.create({
    data: {
      type: 'translation', targetType: 'course', targetId: courses['maraichage-biologique-bases'].id,
      title: 'Traduction suggérée (Anglais) — Maraîchage biologique : les bases',
      payload: {
        language: 'English',
        title: 'Organic Market Gardening: The Basics',
        description: 'Learn the fundamentals of organic market gardening: soil preparation, crop rotation, composting and natural pest control.',
        content: 'This course covers the essential techniques to start a profitable organic market garden: crop selection, sowing calendar, organic fertilization and water management.',
      },
      status: 'pending',
    },
  });
  console.log('✅ 6 suggestions DeerFlow créées (attendance_outreach ×2, quiz_review ×2, cohort_schedule, translation)\n');

  // --- Journal Rappels (ReminderLog) ----------------------------------------
  const reminderRows = [
    { enr: e2, type: 'learning_pace', status: 'success', sentAt: days(-1) },
    { enr: e3, type: 'learning_pace', status: 'success', sentAt: days(-2) },
    { enr: e8, type: 'learning_pace', status: 'success', sentAt: days(-3) },
    { enr: e9, type: 'learning_pace', status: 'success', sentAt: days(-2) },
    { enr: e4, type: 'learning_pace', status: 'success', sentAt: days(-1) },
    { enr: e11, type: 'learning_pace', status: 'failed', sentAt: days(-3), error: 'Adresse email invalide ou boîte de réception pleine' },
    { enr: e5, type: 'rattrapage_reminder', status: 'success', sentAt: days(-15), moduleId: e5.quizModuleId },
    { enr: e10, type: 'rattrapage_reminder', status: 'success', sentAt: days(-21), moduleId: e10.quizModuleId },
    { enr: e12, type: 'rattrapage_reminder', status: 'failed', sentAt: days(-7), moduleId: e12.quizModuleId, error: "Délai d'attente dépassé lors de l'envoi de l'email" },
  ];
  for (const row of reminderRows) {
    await prisma.reminderLog.create({
      data: {
        enrollmentId: row.enr.enrollment.id,
        userId: row.enr.user.id,
        courseId: row.enr.course.id,
        moduleId: row.moduleId || null,
        email: row.enr.user.email,
        status: row.status,
        type: row.type,
        error: row.error || null,
        sentAt: row.sentAt,
        createdAt: row.sentAt,
      },
    });
  }
  console.log(`✅ ${reminderRows.length} entrées du journal des rappels créées\n`);

  // --- Certificats -----------------------------------------------------------
  await prisma.certificate.create({
    data: {
      userId: e1.user.id, courseId: e1.course.id, enrollmentId: e1.enrollment.id,
      certificateNumber: genCertNumber(), score: 96, completionDate: days(-5), status: 'sent',
      attempts: 1, issuedAt: days(-5),
      executionLog: [
        { ts: days(-5).toISOString(), level: 'info', step: 'claim', message: 'Tentative 1' },
        { ts: days(-5).toISOString(), level: 'info', step: 'done', message: 'Certificat émis avec succès' },
      ],
    },
  });
  await prisma.certificate.create({
    data: {
      userId: e6.user.id, courseId: e6.course.id, enrollmentId: e6.enrollment.id,
      certificateNumber: genCertNumber(), score: 88, completionDate: days(-3), status: 'pending', attempts: 0,
    },
  });
  await prisma.certificate.create({
    data: {
      userId: e7.user.id, courseId: e7.course.id, enrollmentId: e7.enrollment.id,
      certificateNumber: genCertNumber(), score: 55, completionDate: days(-10), status: 'failed', attempts: 3,
      lastError: 'IDs Sertifier manquants ou invalides pour ce cours',
      executionLog: [
        { ts: days(-10).toISOString(), level: 'info', step: 'claim', message: 'Tentative 1' },
        { ts: days(-10).toISOString(), level: 'error', step: 'retry', message: 'IDs Sertifier manquants ou invalides pour ce cours' },
        { ts: days(-9).toISOString(), level: 'info', step: 'claim', message: 'Tentative 2' },
        { ts: days(-9).toISOString(), level: 'error', step: 'retry', message: 'IDs Sertifier manquants ou invalides pour ce cours' },
        { ts: days(-8).toISOString(), level: 'info', step: 'claim', message: 'Tentative 3' },
        { ts: days(-8).toISOString(), level: 'error', step: 'failed', message: 'IDs Sertifier manquants ou invalides pour ce cours' },
      ],
    },
  });
  // 'failed' (pas 'processing') : un certificat 'processing' n'a de sens que
  // pendant qu'un worker le traite réellement — en donnée de démo statique,
  // il resterait bloqué pour toujours car le bouton "Relancer" refuse
  // volontairement les lignes 'processing' (garde-fou anti double-émission,
  // POST /:id/retry → 409). 'failed' avec attempts<3 reste, lui, relançable.
  await prisma.certificate.create({
    data: {
      userId: e10.user.id, courseId: e10.course.id, enrollmentId: e10.enrollment.id,
      certificateNumber: genCertNumber(), score: 72, completionDate: days(-14), status: 'failed', attempts: 2,
      lastError: 'IDs Sertifier manquants ou invalides pour ce cours',
      executionLog: [
        { ts: days(-14).toISOString(), level: 'info', step: 'claim', message: 'Tentative 1' },
        { ts: days(-14).toISOString(), level: 'error', step: 'retry', message: 'IDs Sertifier manquants ou invalides pour ce cours' },
        { ts: days(-13).toISOString(), level: 'info', step: 'claim', message: 'Tentative 2' },
        { ts: days(-13).toISOString(), level: 'error', step: 'retry', message: 'IDs Sertifier manquants ou invalides pour ce cours' },
      ],
    },
  });
  console.log('✅ 4 certificats créés (sent, pending→failed, failed, failed[relançable])\n');

  console.log('🎉 Données admin E-Learning & Certifications peuplées avec succès.');
  console.log(`   Comptes apprenants créés (mot de passe: Test1234!): ${LEARNERS.map((l) => l.email).join(', ')}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed admin e-learning:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
