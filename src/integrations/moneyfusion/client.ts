import axios from "axios";

const MONEYFUSION_TOKEN = import.meta.env.VITE_MONEYFUSION_TOKEN;
const MONEYFUSION_BASE_URL = import.meta.env.VITE_MONEYFUSION_API_URL;
const MONEYFUSION_API_URL = `${MONEYFUSION_BASE_URL}${MONEYFUSION_TOKEN}/pay/`;
const MONEYFUSION_NOTIF_URL = import.meta.env.VITE_MONEYFUSION_NOTIF_URL;

export interface PaymentItem {
  [key: string]: number;
}

export interface PersonalInfo {
  userId: string | number;
  orderId: string | number;
}

export interface MoneyFusionPaymentData {
  totalPrice: number;
  article: PaymentItem[];
  personal_Info?: PersonalInfo[];
  numeroSend: string;
  nomclient: string;
  return_url?: string;
  webhook_url?: string;
}

export interface MoneyFusionResponse {
  statut: boolean;
  token: string;
  message: string;
  url: string;
}

export interface MoneyFusionStatusResponse {
  statut: boolean;
  data?: {
    tokenPay: string;
    numeroSend: string;
    nomclient: string;
    Montant: number;
    frais: number;
    statut: "pending" | "failure" | "no paid" | "paid";
    moyen: string;
    createdAt: string;
  };
  message: string;
}

export const moneyFusionClient = {
  /**
   * Créer une demande de paiement
   */
  makePayment: async (paymentData: MoneyFusionPaymentData): Promise<MoneyFusionResponse> => {
    try {
      const response = await axios.post(MONEYFUSION_API_URL, paymentData, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("MoneyFusion makePayment error:", error);
      throw error;
    }
  },

  /**
   * Vérifier l'état d'un paiement via son token
   */
  checkPaymentStatus: async (token: string): Promise<MoneyFusionStatusResponse> => {
    try {
      const response = await axios.get(`${MONEYFUSION_NOTIF_URL}${token}`);
      return response.data;
    } catch (error) {
      console.error("MoneyFusion checkStatus error:", error);
      throw error;
    }
  },
};
