// ==========================================
// RAG Module - Ollama LLM Chat Service
// ==========================================

import { ILlmChatService, LlmChatMessage, LlmConfig } from '../../types';

export class OllamaChatService implements ILlmChatService {
  constructor(private config: LlmConfig) {}

  async generateChat(messages: LlmChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          stream: false,
          messages,
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('Error generating LLM response:', error);
      return "Désolé, je n'ai pas pu générer de réponse pour le moment.";
    }
  }

  async generateChatStream(messages: LlmChatMessage[], onChunk: (chunk: string) => void): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          stream: true,
          messages,
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Ollama streaming request failed: ${response.statusText}`);
      }

      let fullResponse = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line.trim());
              const delta = json?.message?.content;
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
      console.error('Error in LLM stream:', error);
      onChunk("Désolé, je n'ai pas pu générer de réponse pour le moment.");
      return "Désolé, je n'ai pas pu générer de réponse pour le moment.";
    }
  }
}
