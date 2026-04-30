Chaque requête doit inclure une clé API composée de deux parties : publicKey et secretKey . Elles doivent être envoyées sous le format : "x-api-key": "publicKey:secretKey". ou "Authorization": "ApiKey publicKey:secretKey".ou"Authorization": " publicKey:secretKey"

Introduction à l'API
Bienvenue dans la documentation de l'API de livraison

Notre API REST vous permet d'intégrer facilement nos services de livraison dans votre application. Vous pouvez créer des commandes, suivre les livraisons, gérer vos livres et bien plus encore.

URL de base
https://backend-lelivreur.up.railway.app
Format
JSON
Fonctionnalités principales
• Création et gestion des commandes
• Suivi en temps réel des livraisons
• Gestion des livreurs et des zones
• Calcul automatique des tarifs
• Webhook de notifications



Authentification
Comment s'authentifier avec l'API

Chaque requête doit inclure une clé API composée de deux parties : publicKey et secretKey . Elles doivent être envoyées sous le format : "x-api-key": "publicKey:secretKey". ou "Authorization": "ApiKey publicKey:secretKey".ou"Authorization": " publicKey:secretKey"

Types de clés
Clé publique
pk_live_...
Utilisée côté client pour les requêtes publiques

Clé privée
sk_live_...
Utilisée côté serveur, doit rester secret

En-tête d'authentification
Incluez votre clé d'API dans le header Authorization :

x-api-key: pk_live_123456_cle_publique:sk_live_votre_cle_privee

Exemple de requête authentifiée
curl -X GET https://backend-lelivreur.up.railway.app/orders \
  -H "x-api-key: sk_live_votre_cle_privee" \
  -H "Content-Type: application/json"



  curl -X POST "https://backend-lelivreur.up.railway.app/livraisons" \
  -H "x-api-key: pk_live_123456:sk_live_votre_cle_privee" \
  -H "Content-Type: application/json" \
  -d '{
  "commandeId": "3fa85f64-...",
  "pickAddressId": "3fa85f64-...",
  "dropAddressId": "3fa85f64-...",
  "distanceKm": 0,
  "etaMinutes": 1,
  "livreurId": "3fa85f64-..."
}'

Réponse
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "commandeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "livreurId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dropAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "distanceKm": 0,
  "etaMinutes": 0,
  "status": "ATTENTE_PAIEMENT",
  "startedAt": "2026-03-09T08:03:12.389Z",
  "endedAt": "2026-03-09T08:03:12.389Z",
  "signedProofUrl": "string",
  "createdAt": "2026-03-09T08:03:12.389Z",
  "updatedAt": "2026-03-09T08:03:12.389Z",
  "isDelegated": true,
  "isForced": true,
  "forcedBy": "550e8400-e29b-41d4-a716-446655440000",
  "hasRequestedAssignment": true,
  "assignmentRequestStatus": "EN_ATTENTE",
  "assignmentRequestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hasPendingRequest": false,
  "livreur": {
    "id": "string",
    "userId": "string",
    "isSystemResource": true,
    "name": "string",
    "user": { "firstName": "string", "lastName": "string" }
  },
  "entreprise": {
    "id": "string",
    "name": "string",
    "delegateDeliveries": true
  },
  "pickAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "dropAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "commande": {
    "id": "string",
    "referenceExterne": "string",
    "totalAmount": 0,
    "status": "string",
    "entrepriseId": "string",
    "items": [
      {
        "id": "string",
        "quantity": 0,
        "unitPrice": 0,
        "entity": { "id": "string", "name": "string", "unitPrice": 0, "type": "string" },
        "service": { "id": "string", "nom": "string", "prixMinimum": 0, "prixMaximum": 0 }
      }
    ],
    "isPaid": true,
    "client": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string"
    },
    "conversation": {
      "id": "conv-789-ghi",
      "commandeId": "cmd-001",
      "createdAt": "2026-03-03T10:00:00Z"
    }
  },
  "statusHistory": [
    {
      "id": "string",
      "oldStatus": "string",
      "newStatus": "string",
      "changedBy": "string",
      "changedAt": "2026-03-09T08:03:12.390Z"
    }
  ]
}


const axios = require('axios');

const payload = {
  "commandeId": "3fa85f64-...",
  "pickAddressId": "3fa85f64-...",
  "dropAddressId": "3fa85f64-...",
  "distanceKm": 0,
  "etaMinutes": 1,
  "livreurId": "3fa85f64-..."
};

axios.post('https://backend-lelivreur.up.railway.app/livraisons', payload, {
  headers: { 'x-api-key': 'pk_live_123456:sk_live_votre_cle_privee', 'Content-Type': 'application/json' }
}).then(res => console.log(res.data));

Réponse
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "commandeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "livreurId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dropAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "distanceKm": 0,
  "etaMinutes": 0,
  "status": "ATTENTE_PAIEMENT",
  "startedAt": "2026-03-09T08:03:12.389Z",
  "endedAt": "2026-03-09T08:03:12.389Z",
  "signedProofUrl": "string",
  "createdAt": "2026-03-09T08:03:12.389Z",
  "updatedAt": "2026-03-09T08:03:12.389Z",
  "isDelegated": true,
  "isForced": true,
  "forcedBy": "550e8400-e29b-41d4-a716-446655440000",
  "hasRequestedAssignment": true,
  "assignmentRequestStatus": "EN_ATTENTE",
  "assignmentRequestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hasPendingRequest": false,
  "livreur": {
    "id": "string",
    "userId": "string",
    "isSystemResource": true,
    "name": "string",
    "user": { "firstName": "string", "lastName": "string" }
  },
  "entreprise": {
    "id": "string",
    "name": "string",
    "delegateDeliveries": true
  },
  "pickAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "dropAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "commande": {
    "id": "string",
    "referenceExterne": "string",
    "totalAmount": 0,
    "status": "string",
    "entrepriseId": "string",
    "items": [
      {
        "id": "string",
        "quantity": 0,
        "unitPrice": 0,
        "entity": { "id": "string", "name": "string", "unitPrice": 0, "type": "string" },
        "service": { "id": "string", "nom": "string", "prixMinimum": 0, "prixMaximum": 0 }
      }
    ],
    "isPaid": true,
    "client": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string"
    },
    "conversation": {
      "id": "conv-789-ghi",
      "commandeId": "cmd-001",
      "createdAt": "2026-03-03T10:00:00Z"
    }
  },
  "statusHistory": [
    {
      "id": "string",
      "oldStatus": "string",
      "newStatus": "string",
      "changedBy": "string",
      "changedAt": "2026-03-09T08:03:12.390Z"
    }
  ]
}


Lister les livraisons
Paramètres de requête
Nom	Taper	Description
page	nombre	Numéro de page
limite	nombre	Éléments par page
statut	chaîne	Statut de la livraison
est délégué	booléen	Filtrer par délégation

boucle

Node.js

curl -X GET "https://backend-lelivreur.up.railway.app/livraisons" \
  -H "x-api-key: pk_live_123456:sk_live_votre_cle_privee"

Réponse
{
  "data": [
    
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "commandeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "livreurId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dropAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "distanceKm": 0,
  "etaMinutes": 0,
  "status": "ATTENTE_PAIEMENT",
  "startedAt": "2026-03-09T08:03:12.389Z",
  "endedAt": "2026-03-09T08:03:12.389Z",
  "signedProofUrl": "string",
  "createdAt": "2026-03-09T08:03:12.389Z",
  "updatedAt": "2026-03-09T08:03:12.389Z",
  "isDelegated": true,
  "isForced": true,
  "forcedBy": "550e8400-e29b-41d4-a716-446655440000",
  "hasRequestedAssignment": true,
  "assignmentRequestStatus": "EN_ATTENTE",
  "assignmentRequestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hasPendingRequest": false,
  "livreur": {
    "id": "string",
    "userId": "string",
    "isSystemResource": true,
    "name": "string",
    "user": { "firstName": "string", "lastName": "string" }
  },
  "entreprise": {
    "id": "string",
    "name": "string",
    "delegateDeliveries": true
  },
  "pickAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "dropAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "commande": {
    "id": "string",
    "referenceExterne": "string",
    "totalAmount": 0,
    "status": "string",
    "entrepriseId": "string",
    "items": [
      {
        "id": "string",
        "quantity": 0,
        "unitPrice": 0,
        "entity": { "id": "string", "name": "string", "unitPrice": 0, "type": "string" },
        "service": { "id": "string", "nom": "string", "prixMinimum": 0, "prixMaximum": 0 }
      }
    ],
    "isPaid": true,
    "client": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string"
    },
    "conversation": {
      "id": "conv-789-ghi",
      "commandeId": "cmd-001",
      "createdAt": "2026-03-03T10:00:00Z"
    }
  },
  "statusHistory": [
    {
      "id": "string",
      "oldStatus": "string",
      "newStatus": "string",
      "changedBy": "string",
      "changedAt": "2026-03-09T08:03:12.390Z"
    }
  ]

  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}


const axios = require('axios');

axios.get('https://backend-lelivreur.up.railway.app/livraisons', {
  headers: { 'x-api-key': 'pk_live_123456:sk_live_votre_cle_privee' }
}).then(res => console.log(res.data));

Réponse
{
  "data": [
    
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "commandeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "livreurId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dropAddressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "distanceKm": 0,
  "etaMinutes": 0,
  "status": "ATTENTE_PAIEMENT",
  "startedAt": "2026-03-09T08:03:12.389Z",
  "endedAt": "2026-03-09T08:03:12.389Z",
  "signedProofUrl": "string",
  "createdAt": "2026-03-09T08:03:12.389Z",
  "updatedAt": "2026-03-09T08:03:12.389Z",
  "isDelegated": true,
  "isForced": true,
  "forcedBy": "550e8400-e29b-41d4-a716-446655440000",
  "hasRequestedAssignment": true,
  "assignmentRequestStatus": "EN_ATTENTE",
  "assignmentRequestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hasPendingRequest": false,
  "livreur": {
    "id": "string",
    "userId": "string",
    "isSystemResource": true,
    "name": "string",
    "user": { "firstName": "string", "lastName": "string" }
  },
  "entreprise": {
    "id": "string",
    "name": "string",
    "delegateDeliveries": true
  },
  "pickAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "dropAddress": { "id": "string", "street": "string", "lat": 0, "lng": 0 },
  "commande": {
    "id": "string",
    "referenceExterne": "string",
    "totalAmount": 0,
    "status": "string",
    "entrepriseId": "string",
    "items": [
      {
        "id": "string",
        "quantity": 0,
        "unitPrice": 0,
        "entity": { "id": "string", "name": "string", "unitPrice": 0, "type": "string" },
        "service": { "id": "string", "nom": "string", "prixMinimum": 0, "prixMaximum": 0 }
      }
    ],
    "isPaid": true,
    "client": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string"
    },
    "conversation": {
      "id": "conv-789-ghi",
      "commandeId": "cmd-001",
      "createdAt": "2026-03-03T10:00:00Z"
    }
  },
  "statusHistory": [
    {
      "id": "string",
      "oldStatus": "string",
      "newStatus": "string",
      "changedBy": "string",
      "changedAt": "2026-03-09T08:03:12.390Z"
    }
  ]

  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}




Lister les livreurs
Paramètres de requête
Nom	Taper	Description
page	nombre	Numéro de page
limite	nombre	Éléments par page
disponibilité	chaîne	DISPONIBLE, EN_COURSE, HORS_LIGNE, PAUSE
recherche	chaîne	Recherche par nom

boucle

Node.js

curl -X GET "https://backend-lelivreur.up.railway.app/livreurs" \
  -H "x-api-key: pk_live_123456:sk_live_votre_cle_privee"