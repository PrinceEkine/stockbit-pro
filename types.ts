
export type SubscriptionPlan = 'beta' | 'mega' | 'mega_pro';
export type PaymentMethod = 'cash' | 'opay' | 'paga' | 'flutterwave' | 'bank_transfer' | 'paystack';
export type AppLanguage = 'en' | 'yo' | 'ha' | 'ig';

export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  role: 'admin' | 'user' | 'staff';
  trialStartDate: string;
  subscriptionExpiry?: string;
  isSubscribed: boolean;
  isVerified: boolean;
  parentId?: string; // Links staff to business owner in the 'profiles' table
  plan?: SubscriptionPlan;
}

export interface Settings {
  companyName: string;
  currency: string;
  categories: string[];
  lowStockEmailAlerts: boolean;
  notificationEmail: string;
  isPromoActive: boolean;
  promoDiscount: number;
  theme: 'light' | 'dark';
  taxRate: number;
  language: AppLanguage;
  isDynamicPricingActive: boolean;
  paystackPublicKey?: string;
  marketplaces: {
    jumia: boolean;
    konga: boolean;
    whatsapp: boolean;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'sale' | 'system' | 'return';
  date: string;
  read: boolean;
  user_id: string; // Matches DB
}

export interface Product {
  id: string;
  user_id: string; // uuid
  name: string; // text
  sku: string; // text
  category: string; // text
  price: number; // numeric
  cost_price: number; // numeric
  quantity: number; // int4
  min_threshold: number; // int4
  supplier_id: string | null; // uuid
  last_updated: string; // timestamptz
  created_at: string; // timestamptz
  batch_number: string; // text
  expiry_date: string; // date
  location: string; // text
  sustainability_score: number; // int4
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
}

export interface Sale {
  id: string;
  user_id: string; // Matches DB
  items: SaleItem[]; // JSONB in DB
  total_price: number; // Matches DB
  total_cost: number; // Matches DB
  tax_amount: number; // Matches DB
  date: string;
  customer_name?: string; // Matches DB
  location: string;
  payment_method: PaymentMethod; // Matches DB
  status: 'completed' | 'pending';
}

export interface ProductReturn {
  id: string;
  user_id: string; // Matches DB
  sale_id?: string; // Matches DB
  product_id: string; // Matches DB
  product_name: string; // Matches DB
  quantity: number;
  reason: string;
  date: string;
  refunded: boolean;
  location: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
}

export interface StocktakeItem {
  productId: string;
  systemQty: number;
  physicalQty: number;
}

export type AppState = {
  products: Product[];
  sales: Sale[];
  returns: ProductReturn[];
  suppliers: Supplier[];
  notifications: AppNotification[];
  users: User[]; 
  currentUser: User | null;
  settings: Settings;
  error: string | null;
};

export enum View {
  Dashboard = 'dashboard',
  Inventory = 'inventory',
  Sales = 'sales',
  Returns = 'returns',
  Suppliers = 'suppliers',
  AIInsights = 'ai-insights',
  Sustainability = 'sustainability',
  Stocktake = 'stocktake',
  Reports = 'reports',
  Settings = 'settings',
  UserManagement = 'user-management',
  LaunchCenter = 'launch-center'
}
