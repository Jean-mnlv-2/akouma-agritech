# Structure du projet

## Frontend (Vite/React)
- `src/integrations/api/client.ts`: Client HTTP unique vers le backend (Auth + CRUD générique)
- Pages/Composants: utilisent `supabase.from('table')` et `supabase.auth.*` exposés par le client API (sans Supabase)
- Variables d’environnement (fichier `.env.local` à la racine du projet):
```bash
VITE_API_BASE_URL=http://localhost:4000
```

## Backend (Express + Prisma)
- `server/src/index.ts`: Bootstrap Express, CORS, middlewares, `/health`, montage des routes
- `server/src/routes/auth.ts`: `POST /auth/sign-in`, `POST /auth/sign-up`, `POST /auth/sign-out`, `GET /auth/session`
- `server/src/routes/countries.ts`: exemple de ressources spécifiques (CRUD + adminOnly sur écriture)
- `server/src/routes/seeds.ts`: idem
- `server/src/routes/generic.ts`: CRUD générique whiteliste sur `/api/:table` (list/create/update/delete)
- `server/src/middleware/authRequired.ts`: middlewares `authRequired`, `adminOnly` (JWT via cookie `auth_token`)
- `server/prisma/schema.prisma`: modèles initiaux (`User`, `Country`, `Seed`)
- Variables d’environnement backend (fichier `server/.env`):
```bash
PORT=4000
JWT_SECRET=change_me_in_prod
DATABASE_URL="postgresql://user:password@localhost:5432/akouma?schema=public"
FRONTEND_ORIGIN=http://localhost:5173
```

## Commandes backend
```bash
cd server
npm i
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Mappage des routes côté front
- `supabase.from('table').select(...).order(...).range(...)` → `GET /api/table?orderBy=&orderDir=&col=val`
- `supabase.from('table').insert(body)` → `POST /api/table`
- `supabase.from('table').update(body).eq('id', id)` → `PUT /api/table/:id`
- `supabase.from('table').delete().eq('id', id)` → `DELETE /api/table/:id`
- Auth:
  - `supabase.auth.signInWithPassword({ email, password })` → `POST /auth/sign-in`
  - `supabase.auth.signUp({ email, password })` → `POST /auth/sign-up`
  - `supabase.auth.signOut()` → `POST /auth/sign-out`
  - `supabase.auth.getSession()` / `getUser()` → `GET /auth/session`

## Notes
- Le routeur générique couvre: `courses, seeds, news, shop_products, legal_pages, countries, partnerships, donations, contact_messages, content_submissions, demo_requests, elearning_enrollments, newsletter_subscriptions`.
- Pour des validations métiers avancées, préférez des routeurs dédiés (ex: `courses.ts`) plutôt que le générique.
- Cookies d’auth en HttpOnly (SameSite=Lax). Assurez-vous d’utiliser le même domaine/sous-domaine entre front et back.

docker compose exec backend node scripts/createAdmin.js
