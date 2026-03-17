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
        subject: 'Réinitialisation de votre mot de passe - BIA',
        html: `
          <h1>Réinitialisation de mot de passe</h1>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte BIA.</p>
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
        subject: `Rappel d'apprentissage : ${data.courseTitle} - BIA`,
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

  async sendSupervisorWelcomeEmail(email: string, fullName: string, password: string) {
    const loginUrl = `${env.FRONTEND_ORIGINS[0]}/auth`;
    
    if (!resend) {
      console.warn('[EMAIL] Resend API Key non configurée. Identifiants superviseur pour', email, ':', password);
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Bienvenue sur BIA - Vos identifiants de superviseur',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
            <h1 style="color: #10b981; margin-top: 0;">Bienvenue, ${fullName} !</h1>
            <p>Votre compte de <strong>superviseur</strong> a été créé avec succès sur la plateforme BIA Agritech.</p>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #374151;"><strong>Identifiants de connexion :</strong></p>
              <p style="margin: 8px 0 0 0;">Email : <code style="background: #eee; padding: 2px 4px; border-radius: 4px;">${email}</code></p>
              <p style="margin: 8px 0 0 0;">Mot de passe : <code style="background: #eee; padding: 2px 4px; border-radius: 4px;">${password}</code></p>
            </div>
            <p>Vous pouvez maintenant vous connecter pour accéder à votre tableau de bord et gérer les modules qui vous ont été assignés.</p>
            <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Se connecter à mon compte</a>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe dès votre première connexion.</p>
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
  }
};
