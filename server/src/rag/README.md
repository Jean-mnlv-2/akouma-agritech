# Module RAG Kilimo Agritech

Un système RAG (Retrieval-Augmented Generation) professionnel, indépendant et réutilisable pour Kilimo Agritech.

## Architecture

```
src/rag/
├── index.ts                 # Point d'entrée public
├── config/
│   └── index.ts            # Configuration
├── core/
│   ├── embedding/          # Services d'embeddings (Ollama)
│   ├── vector-store/       # Stockage vectoriel (PostgreSQL + pgvector)
│   ├── indexer/            # Indexation des connaissances
│   ├── retriever/          # Recherche sémantique (similarité cosinus)
│   └── workflow/           # Orchestrateur RAG
├── types/
│   └── index.ts            # Interfaces TypeScript publiques
├── adapters/
│   └── KilimoKnowledgeAdapter.ts  # Intégration Kilimo
└── README.md
```

## Fonctionnalités

✅ **Module indépendant** - Peut être réutilisé dans d'autres projets  
✅ **Configuration injectable** - Adaptable à différents environnements  
✅ **Embeddings via Ollama** - Compatible avec les modèles locaux  
✅ **Stockage vectoriel pgvector** - Intégré à PostgreSQL existant  
✅ **Indexation automatisée** - Seeds, formations, actualités (+ ré-indexation ciblée immédiate à la publication pour les actualités, sans attendre le cron)  
✅ **Recherche sémantique** - Similarité cosinus via pgvector, sur-échantillonnage puis filtrage par seuil de score (pas de reranking séparé : testé et retiré, pgvector trie déjà par similarité — voir KnowledgeRetriever.ts)  
✅ **Workflow RAG complet** - Récupération → Augmentation → Génération  
✅ **Streaming de réponse** - Intégré à l'API chat existante  
✅ **Containerisé** - Ollama ajouté à docker-compose.yml avec persistence GPU support et healthcheck  

## Configuration du système

### Avec Docker Compose (Recommandé)
Tout est pré-configuré dans `docker-compose.yml` ! Il inclut :
- PostgreSQL avec pgvector
- Ollama avec GPU support et persistence
- Backend avec RAG intégré
- Frontend

Pour lancer :
```bash
docker-compose up -d
```

Pour télécharger un modèle Ollama (ex: llama3.2):
```bash
docker-compose exec ollama ollama pull llama3.2
```

### Configuration Manuelle

1. **Activer l'extension pgvector dans PostgreSQL**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Appliquer les migrations Prisma**
   ```bash
   cd server
   npx prisma migrate dev
   ```

3. **Variables d'environnement**
   ```env
   # Obligatoire pour la connexion à la base de données
   DATABASE_URL=postgresql://user:password@db:5432/kilimo?schema=public
   
   # Configuration Ollama
   OLLAMA_URL=http://ollama:11434  # Ou http://localhost:11434 en local
   OLLAMA_MODEL=llama3.2                
   OLLAMA_EMBEDDING_MODEL=llama3.2      
   ```

## Utilisation

### Initialiser le système RAG

```typescript
import { RagSystem } from './rag';

const rag = RagSystem.getInstance(prismaClient, {
  embedding: {
    provider: 'ollama',
    baseUrl: 'http://ollama:11434',
    // Modèle d'embedding dédié — jamais le modèle de chat (llama3.2/qwen2.5...).
    // dimensions doit rester <= 2000 pour que l'index HNSW pgvector soit utilisable.
    model: 'nomic-embed-text',
    dimensions: 768,
  },
  retriever: {
    topK: 5,
    scoreThreshold: 0.7,
  },
});
```

### Indexer les connaissances

```typescript
// Indexer tous les contenus Kilimo
import { KilimoKnowledgeAdapter } from './rag/adapters/KilimoKnowledgeAdapter';

const adapter = new KilimoKnowledgeAdapter(prisma, rag.indexer);
await adapter.indexAllContent(); // Indexe seeds, formations, actualités
```

Ou via l'endpoint API (admin seulement):
```
GET /chat/admin/knowledge/sync
```

### Effectuer une requête RAG

```typescript
const response = await rag.orchestrator.query({
  query: "Quelles sont les meilleures graines pour le maïs ?",
  conversationHistory: [...],
});

console.log(response.answer);
console.log(response.sources);
```

### Streaming de réponse

```typescript
await rag.orchestrator.queryStream(
  { query: "..." },
  (chunk: string) => {
    console.log("Recu:", chunk);
  }
);
```

## Modèles de données

### KnowledgeSource
Représente une source de connaissance (article, formation, produit)

```typescript
{
  id: string;
  title: string;
  content: string;
  sourceType: 'seed' | 'course' | 'news' | 'manual';
  metadata?: Record<string, any>;
  createdAt?: Date;
}
```

### KnowledgeChunk
Représente un fragment indexé avec embedding

```typescript
{
  id: string;
  sourceId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
  metadata?: Record<string, any>;
}
```

## Endpoints API

### Synchroniser la base de connaissances (Admin Only)
```
GET /chat/admin/knowledge/sync
```

## Améliorations futures

- [ ] Ajouter le support pour d'autres fournisseurs d'embeddings (OpenAI, Cohere)
- [ ] Ajouter des métriques de performance (temps d'embedding, temps de recherche, etc.)
- [ ] Implémenter la gestion de version des connaissances
- [ ] Ajouter une interface admin pour gérer les connaissances
- [ ] Ajouter un système d'upload de documents (PDF, DOCX, etc.) pour l'indexation manuelle
