import { BusinessEvent } from '../types/events';
import crypto from 'crypto';

export class EventEmitter {
  private webhookUrl: string | null;
  private webhookSecret: string | null;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || null;
    this.webhookSecret = process.env.N8N_SECRET_KEY || process.env.N8N_WEBHOOK_SECRET || null;
    this.enabled = (process.env.EVENT_EMISSION_ENABLED === 'true' || !!this.webhookUrl) && !!this.webhookUrl;
  }

  async emit(event: BusinessEvent): Promise<void> {
    if (!this.enabled) {
      // En dev, on log juste pour info si activé explicitement via une autre var ou verbose,
      // sinon on reste silencieux pour pas polluer, ou on log en debug.
      // Ici on va logger si on est en dev local pour vérifier que ça passe.
      if (process.env.NODE_ENV !== 'production') {
        console.log('[EventEmitter] Event emission disabled or not configured. Event:', event.type);
      }
      return;
    }

    // Émission asynchrone, non-bloquante (Fire & Forget)
    // On utilise setImmediate pour sortir de la boucle d'événements courante
    setImmediate(() => {
      this.sendToN8N(event).catch(err => {
        console.error(`[EventEmitter] Failed to send ${event.type}:`, err);
        // TODO: Implémenter une queue de retry persistante pour la prod
      });
    });
  }

  private async sendToN8N(event: BusinessEvent): Promise<void> {
    if (!this.webhookUrl) return;

    const payload = JSON.stringify({
      event: event.type,
      data: event.data,
      timestamp: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.webhookSecret) {
      const signature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    // Utilisation de AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
      
      console.log(`[EventEmitter] Successfully sent ${event.type}`);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export const eventEmitter = new EventEmitter();
