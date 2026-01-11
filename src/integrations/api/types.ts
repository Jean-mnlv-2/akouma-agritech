export interface ApiUser {
  id: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'supervisor' | 'customer';
  isActive: boolean;
}

export interface ApiSession {
  user: ApiUser | null;
}

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export interface Seed {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  price: number;
  duration: number | null;
  level: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string | null;
  deliveryMethod: 'PICKUP' | 'DELIVERY';
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses: number | null;
  usesCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string | null;
  excerpt: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}
