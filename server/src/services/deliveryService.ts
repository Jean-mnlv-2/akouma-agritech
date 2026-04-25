import axios, { AxiosError } from 'axios';
import { PrismaClient } from '@prisma/client';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const prismaAny = prisma as any;
const apiClient = axios.create({
  baseURL: env.DELIVERY_API_URL,
  headers: {
    'x-api-key': `${env.DELIVERY_API_PUBLIC_KEY}:${env.DELIVERY_API_SECRET_KEY}`,
  },
});

export const PARTNER_CODE_LELIVREUR = 'LE_LIVREUR';

/**
 * Assure que le partenaire de livraison existe en base de données de façon unique.
 */
export const ensurePartnerExists = async () => {
  try {
    const existing = await prismaAny.deliveryPartner.findUnique({
      where: { code: PARTNER_CODE_LELIVREUR },
    });

    if (!existing) {
      const partner = await prismaAny.deliveryPartner.create({
        data: {
          code: PARTNER_CODE_LELIVREUR,
          name: 'Le Livreur',
          description: 'Partenaire de livraison officiel (API)',
          isActive: true,
          baseRate: Number(env.SHIPPING_BASE_FEE || 5000),
        },
      });
      logger.info(`[DeliveryService] Partenaire '${PARTNER_CODE_LELIVREUR}' créé avec succès (ID: ${partner.id}).`);
      return partner;
    }
    return existing;
  } catch (error) {
    logger.error(`[DeliveryService] Erreur lors de la gestion du partenaire unique:`, error);
    return null;
  }
};

/**
 * Gère les erreurs de l'API de livraison
 */
const handleApiError = (error: any, context: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const message = (axiosError.response?.data as any)?.message || axiosError.message;

    logger.error(`[DeliveryService] Error in ${context}: ${status} - ${message}`);

    switch (status) {
      case 400:
        throw new Error(`Requête invalide: ${message}`);
      case 401:
        throw new Error('Non autorisé: Vérifiez vos clés API de livraison');
      case 404:
        throw new Error(`Ressource non trouvée: ${message}`);
      case 500:
        throw new Error('Erreur interne du serveur de livraison');
      default:
        throw new Error(`Erreur API Livraison (${status || 'UNKNOWN'}): ${message}`);
    }
  }
  
  logger.error(`[DeliveryService] Unexpected error in ${context}: ${error.message}`);
  throw error;
};

export const createDelivery = async (deliveryData: any) => {
  try {
    // S'assurer que etaMinutes est à 1 par défaut pour la conformité
    if (!deliveryData.etaMinutes) {
      deliveryData.etaMinutes = 1;
    }

    logger.info(`[DeliveryService] Creating delivery with commandeId: ${deliveryData.commandeId}`);
    const response = await apiClient.post('/livraisons', deliveryData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'createDelivery');
  }
};

export const getShippingEstimate = async (estimateData: {
  pickAddressId: string;
  dropAddressId: string;
  items?: any[];
  cartTotal?: number;
}) => {
  const baseFee = parseInt(env.SHIPPING_BASE_FEE || '5000', 10);
  const freeThreshold = parseInt(env.SHIPPING_FREE_THRESHOLD || '50000', 10);

  // 1. Si le panier atteint le seuil gratuit, pas de frais
  if (estimateData.cartTotal && estimateData.cartTotal >= freeThreshold) {
    return {
      price: 0,
      currency: 'XOF',
      estimatedDays: 1,
      freeThreshold,
      baseFee,
      source: 'free_threshold',
    };
  }

  // 2. Tenter d'appeler Le Livreur
  try {
    const hashData = `${estimateData.pickAddressId}-${estimateData.dropAddressId}-${estimateData.cartTotal || 0}`;
    const stableId = createHash('md5').update(hashData).digest('hex').substring(0, 8);
    const estimateUuid = createHash('md5').update(`ESTIMATE-${hashData}`).digest('hex');
    
    const deliveryPayload: any = {
      commandeId: `KLM-EST-${stableId.toUpperCase()}-${estimateUuid}`,
      pickAddressId: estimateData.pickAddressId,
      dropAddressId: estimateData.dropAddressId,
      distanceKm: 0,
      etaMinutes: 1,
    };

    if (estimateData.items && estimateData.items.length > 0) {
      deliveryPayload.items = estimateData.items.map(item => ({
        id: String(item.id || item.productId),
        quantity: item.quantity,
        unitPrice: item.price || 0,
        name: item.name || ''
      }));
    }

    logger.info(`[DeliveryService] Requesting estimate from Le Livreur with payload:`, deliveryPayload);

    const response = await apiClient.post('/livraisons', deliveryPayload);

    logger.info(`[DeliveryService] Shipping estimate response from Le Livreur:`, response.data);

    const partnerPrice = response.data.commande?.totalAmount;

    return {
      price: (partnerPrice !== undefined && partnerPrice !== null) ? Number(partnerPrice) : baseFee,
      currency: 'XOF',
      estimatedDays: 1,
      deliveryId: response.data.id,
      status: response.data.status,
      source: 'le_livreur',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = JSON.stringify(error.response?.data) || error.message;
      logger.warn(`[DeliveryService] Le Livreur indisponible (${status}): ${message}. Utilisation des frais de base.`);
    } else {
      logger.warn(`[DeliveryService] Erreur estimation: ${error}. Utilisation des frais de base.`);
    }

    // Fallback: retourner les frais de base configurés
    return {
      price: baseFee,
      currency: 'XOF',
      estimatedDays: 1,
      freeThreshold,
      baseFee,
      source: 'default',
    };
  }
};

export const getDeliveries = async (params: any) => {
  try {
    const response = await apiClient.get('/livraisons', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getDeliveries');
  }
};

export const getLivreurs = async (params: any) => {
  try {
    const response = await apiClient.get('/livreurs', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getLivreurs');
  }
};

export const assignLivreur = async (livraisonId: string, livreurId: string) => {
  try {
    const response = await apiClient.put(`/livraisons/${livraisonId}`, { livreurId });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'assignLivreur');
  }
};
