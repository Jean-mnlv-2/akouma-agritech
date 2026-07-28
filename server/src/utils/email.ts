import { Resend } from 'resend';
import { env } from './env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const emailService = {
  async sendResetPasswordEmail(email: string, token: string) {
    const resetUrl = `${env.FRONTEND_ORIGINS[0]}/reset-password?token=${token}`;
    
    if (!resend) {
      console.warn('[EMAIL] Resend API Key non configurée. URL de réinitialisation :', resetUrl);
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Réinitialisation de votre mot de passe - KILIMO',
        html: `
          <h1>Réinitialisation de mot de passe</h1>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte KILIMO.</p>
          <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px;">Réinitialiser mon mot de passe</a>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.</p>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur lors de l\'envoi de l\'e-mail :', error);
      throw new Error('Erreur lors de l\'envoi de l\'e-mail de réinitialisation');
    }
  },

  async sendLearningReminder(data: { email: string; userName: string; courseTitle: string; progress: number; targetEndDate?: Date | null }) {
    if (!resend) {
      console.warn('[EMAIL] Resend API Key non configurée. Impossible d\'envoyer le rappel à :', data.email);
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `Rappel d'apprentissage : ${data.courseTitle} - KILIMO`,
        html: `
          <h1>Bonjour ${data.userName} !</h1>
          <p>C'est le moment idéal pour continuer votre formation sur <strong>${data.courseTitle}</strong>.</p>
          <p>Votre progression actuelle : <strong>${data.progress}%</strong>.</p>
          ${data.targetEndDate ? `<p>Votre objectif est de terminer ce cours d'ici le : <strong>${new Date(data.targetEndDate).toLocaleDateString('fr-FR')}</strong>.</p>` : ''}
          <p>Un petit pas chaque jour vous rapproche de la maîtrise !</p>
          <a href="${env.FRONTEND_ORIGINS[0]}/dashboard/learning" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px;">Continuer mon apprentissage</a>
          <p>Vous pouvez désactiver ces rappels à tout moment depuis votre tableau de bord.</p>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur lors de l\'envoi du rappel :', error);
    }
  },

  async sendSupervisorWelcomeEmail(email: string, fullName: string, resetToken: string) {
    const resetUrl = `${env.FRONTEND_ORIGINS[0]}/reset-password?token=${resetToken}`;
    
    if (!resend) {
      console.warn('[EMAIL] Resend API Key non configurée. URL de création de mot de passe pour', email, ':', resetUrl);
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Bienvenue sur KILIMO - Créez votre mot de passe',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <h1 style="color: #10b981; margin-top: 0;">Bienvenue, ${fullName} !</h1>
            <p>Votre compte de <strong>superviseur</strong> a été créé avec succès sur la plateforme KILIMO Agritech.</p>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #374151;"><strong>Pour commencer :</strong></p>
              <p style="margin: 8px 0 0 0;">Email : <code style="background: #eee; padding: 2px 4px; border-radius: 4px;">${email}</code></p>
            </div>
            <p>Cliquez sur le lien ci-dessous pour définir votre mot de passe et accéder à votre tableau de bord :</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; text-decoration: none;">Définir mon mot de passe</a>
            <p style="margin-top: 16px;">Ce lien expirera dans 7 jours.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Si vous n'avez pas demandé la création de ce compte, vous pouvez ignorer cet email.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur lors de l\'envoi de l\'e-mail de bienvenue :', error);
    }
  },

  async sendJobApplicationNotification(data: { fullName: string; email: string; phone?: string; careerTitle: string; message?: string; cvUrl?: string }) {
    const adminEmail = env.DEFAULT_ADMIN_EMAIL || env.EMAIL_FROM;
    
    if (!resend) {
      console.warn('[EMAIL] Resend API Key non configurée. Nouvelle candidature de', data.fullName, 'pour', data.careerTitle);
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: adminEmail,
        subject: `Nouvelle candidature : ${data.careerTitle} - ${data.fullName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <h1 style="color: #10b981; margin-top: 0;">📋 Nouvelle candidature reçue</h1>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Poste :</strong> ${data.careerTitle}</p>
              <p><strong>Nom :</strong> ${data.fullName}</p>
              <p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              ${data.phone ? `<p><strong>Téléphone :</strong> ${data.phone}</p>` : ''}
            </div>
            ${data.message ? `<div style="margin: 16px 0;"><h3>Message / Motivation :</h3><p>${data.message}</p></div>` : ''}
            ${data.cvUrl ? `<p><strong>CV :</strong> <a href="${data.cvUrl}" style="color: #10b981;">Télécharger le CV</a></p>` : ''}
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 14px; color: #6b7280;">Connectez-vous au <a href="${env.FRONTEND_ORIGINS[0]}/admin">dashboard admin</a> pour gérer cette candidature.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur envoi notification candidature:', error);
    }
  },

  async sendAbsenceNotification(data: {
    email: string;
    userName: string;
    courseTitle: string;
    totalAbsences: number;
    penaltyApplied: boolean;
    currentProgress: number;
  }) {
    if (!resend) {
      console.warn('[EMAIL] Resend non configuré. Notification absence pour', data.email, '- absences:', data.totalAbsences);
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `⚠️ KILIMO - ${data.totalAbsences} absences sur "${data.courseTitle}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <h1 style="color: #dc2626; margin-top: 0;">⚠️ Avertissement d'absences</h1>
            <p>Bonjour ${data.userName},</p>
            <p>Vous avez accumulé <strong>${data.totalAbsences} absences</strong> pour le cours <strong>"${data.courseTitle}"</strong>.</p>
            ${data.penaltyApplied ? `
              <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #fecaca;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">📉 Pénalité appliquée</p>
                <p style="margin: 8px 0 0 0; color: #b91c1c;">Votre progression a été réduite. Progression actuelle : <strong>${Math.round(data.currentProgress)}%</strong></p>
                <p style="margin: 8px 0 0 0; color: #b91c1c; font-size: 13px;">Chaque absence supplémentaire entraînera une pénalité de -10% sur votre progression.</p>
              </div>
            ` : ''}
            <p>Nous vous encourageons à respecter vos créneaux planifiés pour maintenir votre progression et obtenir votre certificat.</p>
            <a href="${env.FRONTEND_ORIGINS[0]}/dashboard/learning" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à mon espace</a>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">KILIMO Agritech — Système de suivi des présences</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur envoi notification absence:', error);
    }
  },

  async sendPromoCashbackNotification(data: {
    ownerEmail: string;
    ownerName: string;
    promoCode: string;
    cashbackAmount: number;
    newBalance: number;
    orderNumber: string;
  }) {
    if (!resend) {
      console.warn('[EMAIL] Resend non configuré. Notification cashback pour', data.ownerEmail, '- montant:', data.cashbackAmount);
      return;
    }

    const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.ownerEmail,
        subject: `KILIMO - Votre code promo ${data.promoCode} a été utilisé !`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <h1 style="color: #10b981; margin-top: 0;">🎉 Bonne nouvelle, ${data.ownerName} !</h1>
            <p>Votre code promo <strong>${data.promoCode}</strong> a été utilisé pour la commande <strong>#${data.orderNumber}</strong>.</p>
            <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #bbf7d0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #166534;">+ ${formatPrice(data.cashbackAmount)} FCFA de cashback</p>
              <p style="margin: 8px 0 0 0; color: #15803d;">Solde disponible : <strong>${formatPrice(data.newBalance)} FCFA</strong></p>
            </div>
            <p>Vous pouvez utiliser ce solde lors de vos prochains achats sur KILIMO pour bénéficier de réductions automatiques.</p>
            <a href="${env.FRONTEND_ORIGINS[0]}/shop" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Visiter la boutique</a>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">Cet e-mail est envoyé automatiquement par KILIMO Agritech.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur envoi notification cashback:', error);
    }
  },

  async sendUnpaidOrderReminder(data: {
    email: string;
    userName: string;
    orderNumber: string;
    total: number;
    daysOld: number;
    items: { name: string; quantity: number }[];
  }) {
    if (!resend) {
      console.warn('[EMAIL] Resend non configuré. Relance commande impayée pour', data.email);
      return;
    }

    const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
    const itemsList = data.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('');

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `⚠️ Rappel : Votre commande #${data.orderNumber} est en attente de paiement`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #10b981; margin: 0;">KILIMO Agritech</h1>
            </div>
            <h2 style="color: #374151; margin-top: 0;">Bonjour ${data.userName},</h2>
            <p>Nous avons remarqué que votre commande <strong>#${data.orderNumber}</strong>, passée il y a ${data.daysOld} jours, est toujours en attente de paiement.</p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; color: #374151; font-size: 16px;">Résumé de la commande :</h3>
              <ul style="padding-left: 20px; color: #4b5563;">
                ${itemsList}
              </ul>
              <p style="margin-bottom: 0; font-weight: bold; font-size: 18px; color: #111827;">Total : ${formatPrice(data.total)} FCFA</p>
            </div>

            <p>Pour finaliser votre achat et recevoir vos produits, veuillez procéder au paiement dès que possible.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.FRONTEND_ORIGINS[0]}/checkout/payment?order=${data.orderNumber}" 
                 style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                 Finaliser mon paiement
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">Note : Les commandes non payées sont automatiquement annulées après 7 jours pour libérer le stock.</p>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
              Si vous avez déjà effectué le paiement, veuillez ignorer cet e-mail ou contacter notre support.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur envoi relance commande impayée:', error);
    }
  },

  async sendOrderCancellationNotice(data: {
    email: string;
    userName: string;
    orderNumber: string;
  }) {
    if (!resend) {
      console.warn('[EMAIL] Resend non configuré. Notification annulation pour', data.email);
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `Annulation de votre commande #${data.orderNumber} - KILIMO`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <h2 style="color: #dc2626; margin-top: 0;">Commande annulée</h2>
            <p>Bonjour ${data.userName},</p>
            <p>Votre commande <strong>#${data.orderNumber}</strong> a été annulée car le paiement n'a pas été reçu dans le délai imparti de 7 jours.</p>
            <p>Si vous souhaitez toujours acquérir ces produits, nous vous invitons à passer une nouvelle commande sur notre boutique.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.FRONTEND_ORIGINS[0]}/shop" 
                 style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                 Retourner à la boutique
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              L'équipe KILIMO Agritech
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('[EMAIL] Erreur envoi notification annulation commande:', error);
    }
  },

  async sendLearningEvent(data: {
    email: string;
    userName: string;
    courseTitle: string;
    type: 'module-completed' | 'course-completed' | 'certificate-ready';
    moduleTitle?: string;
    progress?: number;
    certificateUrl?: string;
    verificationUrl?: string;
  }) {
    if (!resend) {
      console.warn('[EMAIL] Resend non configurée — notification e-learning ignorée pour', data.email);
      return;
    }
    const base = env.FRONTEND_ORIGINS[0];
    let subject = '';
    let body = '';
    if (data.type === 'module-completed') {
      subject = `Module terminé : ${data.moduleTitle || ''} - KILIMO`;
      body = `
        <h2 style="color:#1E5B37">Bravo ${data.userName} ! 🎉</h2>
        <p>Vous venez de terminer le module <strong>${data.moduleTitle}</strong> de la formation <strong>${data.courseTitle}</strong>.</p>
        <p>Progression actuelle : <strong>${data.progress ?? 0}%</strong></p>
        <p><a href="${base}/dashboard/learning" style="display:inline-block;padding:12px 24px;background:#1E5B37;color:#fff;border-radius:8px;text-decoration:none">Continuer ma formation</a></p>`;
    } else if (data.type === 'course-completed') {
      subject = `Formation terminée : ${data.courseTitle} - KILIMO`;
      body = `
        <h2 style="color:#1E5B37">Félicitations ${data.userName} ! 🏆</h2>
        <p>Vous avez terminé avec succès la formation <strong>${data.courseTitle}</strong>.</p>
        <p>Votre certificat est en cours de génération et vous sera envoyé sous peu.</p>
        <p><a href="${base}/dashboard/learning" style="display:inline-block;padding:12px 24px;background:#E57D27;color:#fff;border-radius:8px;text-decoration:none">Voir mes succès</a></p>`;
    } else {
      subject = `Votre certificat KILIMO est prêt : ${data.courseTitle}`;
      body = `
        <h2 style="color:#1E5B37">Votre certificat est disponible !</h2>
        <p>Bonjour ${data.userName},</p>
        <p>Votre certificat pour la formation <strong>${data.courseTitle}</strong> est prêt à être téléchargé.</p>
        ${data.certificateUrl ? `<p><a href="${data.certificateUrl}" style="display:inline-block;padding:12px 24px;background:#1E5B37;color:#fff;border-radius:8px;text-decoration:none">📄 Télécharger mon certificat (PDF)</a></p>` : ''}
        ${data.verificationUrl ? `<p style="font-size:13px;color:#6b7280">Lien de vérification publique : <a href="${data.verificationUrl}">${data.verificationUrl}</a></p>` : ''}`;
    }
    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">${body}<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af;text-align:center">L'équipe KILIMO Agritech</p></div>`,
      });
    } catch (e) {
      console.error('[EMAIL] Notif e-learning échouée:', e);
    }
  },

  async sendSubscriptionTrialEndingEmail(data: {
    email: string;
    userName: string;
    planName: string;
    trialEndDate: Date;
    pricingUrl?: string;
  }) {
    if (!resend) {
      console.warn('[EMAIL] Resend non configuré. Notification fin d’essai pour', data.email);
      return;
    }

    const pricingUrl = data.pricingUrl || `${env.FRONTEND_ORIGINS[0]}/pricing`;

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `Votre essai ${data.planName} arrive à échéance - KILIMO`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#1E5B37;margin-top:0">Bonjour ${data.userName},</h2>
            <p>Votre période d’essai du forfait <strong>${data.planName}</strong> se termine le <strong>${new Date(data.trialEndDate).toLocaleDateString('fr-FR')}</strong>.</p>
            <p>Pour conserver l’accès aux fonctionnalités avancées du chatbot et aux documents personnalisés, activez votre abonnement dès maintenant.</p>
            <p style="margin:24px 0">
              <a href="${pricingUrl}" style="display:inline-block;padding:12px 24px;background:#1E5B37;color:#fff;border-radius:8px;text-decoration:none">Choisir mon forfait</a>
            </p>
            <p style="font-size:12px;color:#9ca3af">L’équipe KILIMO Agritech</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('[EMAIL] Notification fin d’essai échouée:', e);
    }
  },

  async sendSubscriptionInvoiceEmail(data: {
    email: string;
    userName: string;
    planName: string;
    invoiceNumber: string;
    amount: number;
    pdfUrl: string;
  }) {
    if (!resend) {
      console.warn('[EMAIL] Resend non configuré. Facture abonnement pour', data.email);
      return;
    }

    const formattedAmount = new Intl.NumberFormat('fr-FR').format(Math.round(data.amount));

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `Votre facture ${data.invoiceNumber} - KILIMO`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#1E5B37;margin-top:0">Facture d’abonnement disponible</h2>
            <p>Bonjour ${data.userName},</p>
            <p>Votre paiement pour le forfait <strong>${data.planName}</strong> a été confirmé.</p>
            <p>Montant facturé : <strong>${formattedAmount} FCFA</strong></p>
            <p>Numéro de facture : <strong>${data.invoiceNumber}</strong></p>
            <p style="margin:24px 0">
              <a href="${data.pdfUrl}" style="display:inline-block;padding:12px 24px;background:#1E5B37;color:#fff;border-radius:8px;text-decoration:none">Télécharger la facture PDF</a>
            </p>
            <p style="font-size:12px;color:#9ca3af">Merci pour votre confiance. L’équipe KILIMO Agritech</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('[EMAIL] Envoi facture abonnement échoué:', e);
    }
  },
};
