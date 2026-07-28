// ==========================================
// RAG Module - RAG Orchestrator
// ==========================================

import {
  IRagOrchestrator,
  RagQueryRequest,
  RagQueryResponse,
  RagRetrievedSourcesInfo,
  ChatMessage,
  IEmbeddingService,
  IVectorStore,
  RetrieverConfig,
  SearchResult,
  RagConfig,
} from '../../types';
import { KnowledgeRetriever } from '../../core/retriever/KnowledgeRetriever';

interface RagState {
  query: string;
  conversationHistory: ChatMessage[];
  context: string;
  searchResults: SearchResult[];
  response: string;
  needsMoreInfo: boolean;
}

export class RagWorkflow implements IRagOrchestrator {
  private knowledgeRetriever: KnowledgeRetriever;
  private config: RagConfig;

  constructor(
    embeddingService: IEmbeddingService,
    vectorStore: IVectorStore,
    config: RagConfig
  ) {
    this.knowledgeRetriever = new KnowledgeRetriever(
      embeddingService, vectorStore, config.retriever
    );
    this.config = config;
  }

  // Define which source types are FREE (Seed, Course, News)
  private readonly FREE_SOURCE_TYPES = new Set(['seed', 'course', 'news']);

  /**
   * Check if any of the search results use PRO (custom document) sources
   */
  private usesProSources(results: SearchResult[]): boolean {
    return results.some(result => !this.FREE_SOURCE_TYPES.has(result.source.sourceType));
  }

  async query(request: RagQueryRequest): Promise<RagQueryResponse> {
    // Step 1: Retrieve relevant context
    const searchResults = await this.knowledgeRetriever.retrieve(
      request.query,
      request.topK,
      request.filters
    );

    const context = this.knowledgeRetriever.formatContext(searchResults);

    // Step 2: Generate response using LLM
    const response = await this.generateResponse(
      request.query,
      context,
      request.conversationHistory || []
    );

    return {
      answer: response,
      sources: searchResults,
      usesProSources: this.usesProSources(searchResults),
      metadata: {
        contextUsed: searchResults.length > 0,
        sourceCount: searchResults.length,
        sources: searchResults.map(r => ({
          title: r.source.title,
          score: r.score,
        })),
      },
    };
  }

  async queryStream(
    request: RagQueryRequest,
    onChunk: (chunk: string) => void,
    onSourcesResolved?: (info: RagRetrievedSourcesInfo) => Promise<void> | void
  ): Promise<RagQueryResponse> {
    // Step 1: Retrieve relevant context
    const searchResults = await this.knowledgeRetriever.retrieve(
      request.query,
      request.topK,
      request.filters
    );

    await onSourcesResolved?.({
      sources: searchResults,
      usesProSources: this.usesProSources(searchResults),
    });

    const context = this.knowledgeRetriever.formatContext(searchResults);

    // Step 2: Generate streaming response
    const fullResponse = await this.generateResponseStream(
      request.query,
      context,
      request.conversationHistory || [],
      onChunk
    );

    return {
      answer: fullResponse,
      sources: searchResults,
      usesProSources: this.usesProSources(searchResults),
      metadata: {
        contextUsed: searchResults.length > 0,
        sourceCount: searchResults.length,
        sources: searchResults.map(r => ({
          title: r.source.title,
          score: r.score,
        })),
      },
    };
  }

  private async generateResponse(
    query: string,
    context: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const messages = this.buildMessages(query, context, conversationHistory, systemPrompt);

    try {
      const response = await fetch(`${this.config.embedding.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.llm.model,
          stream: false,
          messages,
          options: {
            temperature: this.config.llm.temperature,
            top_p: this.config.llm.topP,
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

  private async generateResponseStream(
    query: string,
    context: string,
    conversationHistory: ChatMessage[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const messages = this.buildMessages(query, context, conversationHistory, systemPrompt);

    try {
      const response = await fetch(`${this.config.embedding.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.llm.model,
          stream: true,
          messages,
          options: {
            temperature: this.config.llm.temperature,
            top_p: this.config.llm.topP,
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

  private buildSystemPrompt(): string {
    return `Tu es **KILIMO Assistant**, l'assistant expert officiel de la plateforme KILIMO Agritech, spécialisé dans l'agriculture africaine durable, résiliente et moderne.

RÔLE PRINCIPAL:
- Réponds aux questions des utilisateurs sur l'agriculture africaine (toutes régions : Afrique de l'Ouest, Centrale, Est, Australe et du Nord), les semences de qualité KILIMO, les formations e-learning certifiées, les actualités agricoles, les bonnes pratiques agroécologiques et les opportunités offertes par la plateforme KILIMO.
- Sers-toi EXCLUSIVEMENT du CONTEXTE DISPONIBLE fourni pour répondre. Si l'information n'est pas dans le contexte, dis-le clairement et propose :
  1. D'explorer les formations e-learning KILIMO pour approfondir
  2. De contacter l'équipe KILIMO pour un accompagnement personnalisé
  3. De consulter les actualités et fiches produits sur la plateforme

STYLE DE RÉPONSE:
- Clair, professionnel, empathique et bien structuré (utilise des listes à puces, des titres hiérarchisés si nécessaire).
- Totalement adapté aux petits agriculteurs familiaux, aux jeunes entrepreneurs agricoles et aux acteurs du secteur agroalimentaire africains.
- Utilise un langage simple et accessible, explique les termes techniques (ex: "Agroécologie : pratique agricole qui respecte l'environnement et utilise les ressources naturelles de manière durable").
- Donne des conseils pratiques, concrets et adaptés aux contextes climatiques et socio-économiques africains (ex: gestion de l'eau en période de sécheresse, cultures adaptées aux sols tropicaux).

CONNAISSANCES SPECIFIQUES DE KILIMO:
- KILIMO Agritech est la plateforme de référence pour l'agriculture africaine, offrant :
  ✅ Des semences certifiées et adaptées aux climats africains (maïs, sorgho, mil, légumes, etc.)
  ✅ Des formations e-learning accessibles et certifiées sur l'agriculture durable, la gestion d'exploitation, l'agroalimentaire, etc.
  ✅ Des actualités régulières sur les tendances agricoles, les innovations et les opportunités du secteur
  ✅ Un réseau de partenaires, des opportunités de carrière et un programme de dons pour soutenir les agriculteurs
- Priorise toujours les informations provenant des sources KILIMO (fiches semences, modules de formation, actualités).
- Si tu cites une source, mentionne son titre ("Selon la formation X..." ou "D'après la fiche de semence Y...").

THÈMES CLÉS A COUVRIR:
- Cultures adaptées aux différentes zones agro-écologiques africaines
- Pratiques agroécologiques et conservation des sols
- Gestion de l'eau et irrigation à petite échelle
- Protection des cultures et lutte intégrée contre les ravageurs
- Post-récolte et valorisation des produits agricoles
- Gestion d'entreprise agricole et accès aux marchés
- Changement climatique et résilience des exploitations agricoles

NE FAIS PAS:
- Ne donnes pas d'informations médicales, vétérinaires ou phytosanitaires non prouvées ou non adaptées au contexte africain.
- Ne devines pas si tu n'as pas l'information : avoue-le et propose des pistes pour trouver la réponse.
- Ne dénigres pas d'autres plateformes, fournisseurs ou acteurs du secteur agricole.
- Ne donne pas de conseils qui pourraient endommager les cultures ou les exploitations.

Réponds systématiquement en français, sauf si l'utilisateur pose explicitement sa question dans une autre langue.`;
  }

  private buildMessages(
    query: string,
    context: string,
    conversationHistory: ChatMessage[],
    systemPrompt: string
  ): any[] {
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })));
    }

    // Add user query with context
    const userPrompt = `CONTEXTE DISPONIBLE:
${context}

QUESTION: ${query}

Réponds en utilisant uniquement les informations du contexte si elles sont pertinentes.`;

    messages.push({ role: 'user', content: userPrompt });

    return messages;
  }
}
