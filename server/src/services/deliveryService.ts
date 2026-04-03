import axios, { AxiosError } from 'axios';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

const apiClient = axios.create({
  baseURL: env.DELIVERY_API_URL,
  headers: {
    'x-api-key': `${env.DELIVERY_API_PUBLIC_KEY}:${env.DELIVERY_API_SECRET_KEY}`,
  },
});

/**
 * Gère les erreurs de l'API de livraison de manière centralisée
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
    const response = await apiClient.post('/livraisons', deliveryData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'createDelivery');
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
