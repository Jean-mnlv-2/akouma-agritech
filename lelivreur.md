API Developer
Gérez vos clés API et accédez à la documentation pour développeurs

Gérer mes secrets
Documentation
Documentation API Developer
Guide d'utilisation des API pour développeurs

Introduction
Authentification
Exemples
Bonnes pratiques
Chaque requête doit inclure une clé API composée de deux parties :publicKey et secretKey. Elles doivent être envoyées sous le format :"x-api-key": "publicKey:secretKey". ou"Authorization": "ApiKey publicKey:secretKey".ou"Authorization": " publicKey:secretKey"

Introduction à l'API
Bienvenue dans la documentation de l'API de livraison

Notre API REST vous permet d'intégrer facilement nos services de livraison dans votre application. Vous pouvez créer des commandes, suivre les livraisons, gérer vos livreurs et bien plus encore.


Format
JSON
Fonctionnalités principales
• Création et gestion des commandes
• Suivi en temps réel des livraisons
• Gestion des livreurs et des zones
• Calcul automatique des tarifs
• Notifications webhook

Authentification
Comment s'authentifier avec l'API

Chaque requête doit inclure une clé API composée de deux parties :publicKey et secretKey. Elles doivent être envoyées sous le format :"x-api-key": "publicKey:secretKey". ou"Authorization": "ApiKey publicKey:secretKey".ou"Authorization": " publicKey:secretKey"

Types de clés
Clé publique
pk_live_...
Utilisée côté client pour les requêtes publiques

Clé privée
sk_live_...
Utilisée côté serveur, doit rester secrète

Authentification par header
Incluez votre clé d'API dans le header Authorization :

x-api-key: pk_live_123456_cle_publique:sk_live_votre_cle_privee

Exemple de requête authentifiée
curl -X GET https:// \
  -H "x-api-key: sk_live_votre_cle_privee" \
  -H "Content-Type: application/json"

  Créer une livraison
cURL
Node.js
Python
PHP
curl -X POST "/livraisons" \
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

exemple nodejs : 

Créer une livraison
cURL
Node.js
Python
PHP
const axios = require('axios');

const payload = {
  "commandeId": "3fa85f64-...",
  "pickAddressId": "3fa85f64-...",
  "dropAddressId": "3fa85f64-...",
  "distanceKm": 0,
  "etaMinutes": 1,
  "livreurId": "3fa85f64-..."
};

axios.post(' /livraisons', payload, {
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

GET
/livraisons
Lister les livraisons
Lister les livraisons
Paramètres de requête
Nom	Type	Description
page	number	Numéro de page
limit	number	Éléments par page
status	string	Statut de la livraison
isDelegated	boolean	Filtrer par délégation
cURL
Node.js
Python
PHP
curl -X GET "   /livraisons" \
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

Sécurité
Ne jamais exposer vos clés privées côté client
Utilisez HTTPS pour toutes les requêtes
Régénérez vos clés régulièrement
Stockez vos clés dans des variables d'environnement
Limitez les permissions des clés selon vos besoins
Gestion des erreurs
L'API retourne des codes d'erreur HTTP standard :

200
Succès
400
Requête invalide
401
Non autorisé
404
Ressource non trouvée
500
Erreur serveur
Limites de taux
• 1000 requêtes par heure pour les clés publiques
• 5000 requêtes par heure pour les clés privées
• Les limites sont réinitialisées chaque heure
• Headers de réponse incluent les limites actuelles
Rotation des clés
• Planifiez une rotation régulière de vos clés API
• Testez les nouvelles clés avant de supprimer les anciennes
• Documentez vos processus de rotation
• Surveillez l'utilisation après rotation



