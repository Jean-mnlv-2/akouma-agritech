# Akouma Backend (Express + Prisma)

- Copier `.env.example` en `.env` et renseigner `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`.
- `npm i`
- `npm run prisma:generate`
- `npm run prisma:migrate` (dev) ou `npm run prisma:deploy` (prod)
- `npm run dev`

## Variables d'environnement importantes

- `JWT_SECRET`: en production **>= 32 caractères**.
- `FRONTEND_ORIGINS`: liste d'origines séparées par des virgules.
- **Livraison**: `DELIVERY_API_URL`, `DELIVERY_API_PUBLIC_KEY`, `DELIVERY_API_SECRET_KEY` (ne jamais commiter de clés).
- **Paiements / webhook**: définir `MONEYFUSION_NOTIF_URL` (URL de vérification statut) et/ou `MONEYFUSION_WEBHOOK_SECRET` (secret exigé via header `x-webhook-secret` si pas de notif URL).







