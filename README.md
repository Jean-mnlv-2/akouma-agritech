# Akouma Agritech — Frontend & Backend

## Structure

- Frontend (Vite/React): voir PROJECT_STRUCTURE.md et le dossier src/
- Backend (Express + Prisma): dossier server/

## Démarrage rapide

### Backend
1. Créez server/.env (voir PROJECT_STRUCTURE.md)
   ```bash
   DEFAULT_ADMIN_EMAIL=admin@akouma.test
   DEFAULT_ADMIN_PASSWORD=Admin123!
   DEFAULT_ADMIN_FULL_NAME="AKOUMA Admin"
   # Facultatif : fixez à true pour forcer la réinitialisation du mot de passe au démarrage
   # DEFAULT_ADMIN_FORCE_RESET=false
   ```
2. Installez et migrez:
   ```bash
   cd server
   npm i
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

3. Vérifiez: GET http://localhost:4000/health

> **Accès administrateur (développement)** : un compte admin est automatiquement créé si nécessaire.
> - Email : `admin@akouma.test`
> - Mot de passe : `Admin123!`
> Modifiez ces valeurs dans `server/.env` ou via les variables d'environnement ci-dessus.

### Frontend
1. Créez .env.local à la racine:
   ```bash
   VITE_API_BASE_URL=http://localhost:4000
   ```

2. Installez et lancez:
   ```bash
   npm i
   npm run dev
   ```


## Lancement avec Docker

### Prérequis
- Docker Desktop (avec Docker Compose v2)
- **Optionnel** : Créez un fichier `.env` à la racine du projet pour personnaliser les variables (sinon les valeurs par défaut seront utilisées) :
  ```bash
  # Variables pour Docker Compose
  JWT_SECRET=votre_secret_jwt_de_32_caracteres_minimum_1234567890
  POSTGRES_USER=akouma
  POSTGRES_PASSWORD=akouma
  POSTGRES_DB=akouma
  FRONTEND_ORIGIN=http://localhost:8080
  VITE_API_BASE_URL=http://localhost:4000
  DEFAULT_ADMIN_EMAIL=admin@akouma.test
  DEFAULT_ADMIN_PASSWORD=Admin123!
  DEFAULT_ADMIN_FULL_NAME="AKOUMA Admin"
  # Livraison (ne jamais commiter de clés live)
  DELIVERY_API_URL=https://backend-lelivreur.up.railway.app
  DELIVERY_API_PUBLIC_KEY=pk_live_xxx
  DELIVERY_API_SECRET_KEY=sk_live_xxx
  # Paiements (sécurisation des webhooks)
  MONEYFUSION_WEBHOOK_SECRET=un_secret_long_aleatoire
  ```
  
  **Important** : `JWT_SECRET` doit contenir **au moins 32 caractères** car le backend est en mode production dans Docker. Si vous ne créez pas de fichier `.env`, une valeur par défaut de 32+ caractères sera utilisée automatiquement. Utilisez `DEFAULT_ADMIN_FORCE_RESET=true` ponctuellement pour régénérer le mot de passe admin dans un environnement Docker.

### Démarrage
Depuis la racine du projet :
bash
docker compose up --build

### stopper 

docker compose down


Le compose démarre trois services :
- *db* : PostgreSQL (port 5432)
- *backend* : API Express/Prisma (port 4000)
- *frontend* : application Vite servie via Nginx (port 8080)

Attendez que les trois services soient healthy, puis :
- API: http://localhost:4000/health
- Frontend: http://localhost:8080

### Commandes utiles
- Rejouer les migrations une fois la base accessible :
  ```bash
  docker compose exec backend npx prisma migrate deploy
  ```
- Appliquer la migration manuelle des promos / historique si nécessaire :
  ```bash
  docker compose exec db psql -U postgres -d akouma -f /app/prisma/migrations/manual_add_promos.sql
  ```

- Afficher les logs :
  bash
  docker compose logs -f backend
  docker compose logs -f frontend
  
- Arrêter et nettoyer :
  bash
  docker compose down
  

## Technologies
- Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- Express, Prisma, PostgreSQL

Consultez PROJECT_STRUCTURE.md pour le détail des routes et le mappage front → backend.

## Vérification des API

### Routes principales disponibles

**Authentification :**
- `GET /auth/session` - Vérifier la session utilisateur
- `POST /auth/sign-in` - Connexion (compte admin généré automatiquement via `DEFAULT_ADMIN_*`)
- `POST /auth/sign-up` - Inscription
- `POST /auth/sign-out` - Déconnexion

**Données publiques :**
- `GET /api/countries` - Liste des pays
- `GET /api/seeds` - Liste des graines
- `GET /api/courses` - Liste des cours
- `GET /api/news` - Actualités
- `GET /api/shop_products` - Produits de la boutique
- `GET /api/contact_settings` - Paramètres de contact
- `GET /api/events` - Événements
- `GET /api/careers` - Offres d'emploi
- `GET /api/donation_impacts` - Impacts des dons
- `GET /api/success_stories` - Histoires de succès

**Routes administrateur (authentification requise) :**
- `GET /api/contact_messages` - Messages de contact
- `GET /api/content_submissions` - Soumissions de contenu
- `GET /api/demo_requests` - Demandes de démo
- `GET /api/profiles` ou `/api/users` - Utilisateurs
- `GET /api/tasks` - Tâches
- `GET /api/stats` - Statistiques

**Routes génériques (CRUD) :**
- `GET /api/:table` - Liste
- `POST /api/:table` - Créer (admin)
- `PUT /api/:table/:id` - Mettre à jour (admin)
- `DELETE /api/:table/:id` - Supprimer (admin)

### Tables disponibles pour le CRUD générique
- `courses`, `seeds`, `news`, `shop_products`, `legal_pages`
- `countries`, `partnerships`, `donations`
- `contact_messages`, `content_submissions`, `demo_requests`
- `elearning_enrollments`, `newsletter_subscriptions`
- `profiles`, `user_roles`, `events`, `careers`
- `contact_settings`

### Notes importantes
- Toutes les routes utilisent le proxy Nginx en production Docker (port 8080)
- Les routes admin nécessitent une authentification (cookie `auth_token`)
- Les erreurs sont gérées gracieusement (tables manquantes retournent des tableaux vides)
- Le service worker ne bloque pas les requêtes cross-origin