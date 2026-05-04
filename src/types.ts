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
  address?: string;
  isAdmin?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}
