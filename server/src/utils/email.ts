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
        subject: 'Réinitialisation de votre mot de passe - AKOUMA',
        html: `
          <h1>Réinitialisation de mot de passe</h1>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte AKOUMA.</p>
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
        subject: `Rappel d'apprentissage : ${data.courseTitle} - AKOUMA`,
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
  }
};
