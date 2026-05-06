export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  shortAddress?: string;
  isAdmin?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  city?: string;
  address: string;
  shortAddress?: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  shippingCost?: number;
  shippingType?: string;
  discount?: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod?: string;
  hasReceipt?: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  expiryDate?: string;
  active: boolean;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  content: string;
  rating: number;
  date: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  estimatedDays: string;
  active: boolean;
  cities: string[]; // Added this
  allCities: boolean; // Added this to toggle between all cities or specific ones
  createdAt: string;
}

export interface InvoiceConfig {
  storeName: string;
  storeAddress: string;
  taxNumber: string;
  phone: string;
  email: string;
  logoUrl?: string;
  footerMessage?: string;
  vatRate: number;
  isTaxEnabled: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'popup' | 'banner';
  platform: 'web' | 'mobile' | 'both';
  position: 'top' | 'center' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'rectangle' | 'rounded' | 'circle';
  active: boolean;
  maxViews?: number;
  autoHideSeconds?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}
