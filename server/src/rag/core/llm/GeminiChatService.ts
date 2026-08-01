// ==========================================
// RAG Module - Google Gemini LLM Chat Service
// ==========================================

import { ILlmChatService, LlmChatMessage, LlmConfig } from '../../types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Convertit le format OpenAI/Ollama (system|user|assistant) vers celui de
 * l'API Gemini : une seule `systemInstruction` (pas un rôle "system" dans le
 * tableau de tours de conversation) + `contents` avec les rôles "user"/"model"
 * (Gemini n'a pas de rôle "assistant").
 */
function toGeminiPayload(messages: LlmChatMessage[]): { systemInstruction?: object; contents: object[] } {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const turns = messages.filter((m) => m.role !== 'system');

  return {
    systemInstruction: systemMessages.length > 0
      ? { parts: [{ text: systemMessages.map((m) => m.content).join('\n\n') }] }
      : undefined,
    contents: turns.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  };
}

export class GeminiChatService implements ILlmChatService {
  constructor(private config: LlmConfig) {
    if (!config.apiKey) {
      throw new Error('GEMINI_API_KEY manquante : requise quand AI_PROVIDER=gemini');
    }
  }

  async generateChat(messages: LlmChatMessage[]): Promise<string> {
    try {
      const { systemInstruction, contents } = toGeminiPayload(messages);
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction,
            generationConfig: { temperature: this.config.temperature, topP: this.config.topP },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      return "Désolé, je n'ai pas pu générer de réponse pour le moment.";
    }
  }

  async generateChatStream(messages: LlmChatMessage[], onChunk: (chunk: string) => void): Promise<string> {
    try {
      const { systemInstruction, contents } = toGeminiPayload(messages);
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${this.config.model}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction,
            generationConfig: { temperature: this.config.temperature, topP: this.config.topP },
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errorText = response.body ? '' : await response.text().catch(() => '');
        throw new Error(`Gemini streaming request failed: ${response.status} ${errorText}`);
      }

      let fullResponse = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Événements SSE séparés par une ligne vide ; chaque événement porte
        // une ou plusieurs lignes "data: {...}".
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
              const delta = json?.candidates?.[0]?.content?.parts?.[0]?.text;
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
      console.error('Error in Gemini stream:', error);
      onChunk("Désolé, je n'ai pas pu générer de réponse pour le moment.");
      return "Désolé, je n'ai pas pu générer de réponse pour le moment.";
    }
  }
}
