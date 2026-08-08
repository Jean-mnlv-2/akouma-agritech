// ==========================================
// RAG Module - DeepSeek LLM Chat Service
// ==========================================
// API compatible OpenAI (chat completions) — contrairement à Gemini, les
// messages system|user|assistant sont envoyés tels quels, sans conversion de
// format. Voir https://api-docs.deepseek.com.

import { ILlmChatService, LlmChatMessage, LlmConfig } from '../../types';

const DEEPSEEK_API_BASE = 'https://api.deepseek.com';

export class DeepSeekChatService implements ILlmChatService {
  constructor(private config: LlmConfig) {
    if (!config.apiKey) {
      throw new Error('DEEPSEEK_API_KEY manquante : requise quand AI_PROVIDER=deepseek');
    }
  }

  async generateChat(messages: LlmChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          temperature: this.config.temperature,
          top_p: this.config.topP,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating DeepSeek response:', error);
      return "Désolé, je n'ai pas pu générer de réponse pour le moment.";
    }
  }

  async generateChatStream(messages: LlmChatMessage[], onChunk: (chunk: string) => void): Promise<string> {
    try {
      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: true,
          temperature: this.config.temperature,
          top_p: this.config.topP,
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = response.body ? '' : await response.text().catch(() => '');
        throw new Error(`DeepSeek streaming request failed: ${response.status} ${errorText}`);
      }

      let fullResponse = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          for (const line of event.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const json = JSON.parse(jsonStr);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta) {
                fullResponse += delta;
                onChunk(delta);
              }
            } catch (e) {
              // ignore invalid JSON lines
            }
          }
        }
      }
      return fullResponse;
    } catch (error) {
      console.error('Error in DeepSeek stream:', error);
      onChunk("Désolé, je n'ai pas pu générer de réponse pour le moment.");
      return "Désolé, je n'ai pas pu générer de réponse pour le moment.";
    }
  }
}
