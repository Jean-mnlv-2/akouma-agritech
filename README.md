# Akouma Agritech — Frontend & Backend

## Structure

- Frontend (Vite/React): voir `PROJECT_STRUCTURE.md` et le dossier `src/`
- Backend (Express + Prisma): dossier `server/`

## Démarrage rapide

### Backend
1. Créez `server/.env` (voir `PROJECT_STRUCTURE.md`)
2. Installez et migrez:
```bash
cd server
npm i
npx prisma generate
npx prisma migrate dev
npm run dev
```
3. Vérifiez: `GET http://localhost:4000/health`

### Frontend
1. Créez `.env.local` à la racine:
```bash
VITE_API_BASE_URL=http://localhost:4000
```
2. Installez et lancez:
```bash
npm i
npm run dev
```

## Technologies
- Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- Express, Prisma, PostgreSQL

Consultez `PROJECT_STRUCTURE.md` pour le détail des routes et le mappage front → backend.
