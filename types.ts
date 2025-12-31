
export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  password?: string;
  role: 'admin' | 'user';
  trialStartDate: string;
  subscriptionExpiry?: string;
  isSubscribed: boolean;
  isVerified: boolean;
  verificationCode?: string;
  resetCode?: string;
}

export interface Settings {
  companyName: string;
  currency: string;
  categories: string[];
  lowStockEmailAlerts: boolean;
  notificationEmail: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'sale' | 'system';
  date: string;
  read: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  minThreshold: number;
  supplierId: string;
  lastUpdated: string;
  batchNumber: string;
  expiryDate: string;
  createdAt?: string; // For stock aging
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
  items: SaleItem[];
  totalPrice: number;
  totalCost: number;
  date: string;
  customerName?: string;
  isChecked?: boolean;
  isArchived?: boolean;
}

export interface Supplier {
  id: string;
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
  suppliers: Supplier[];
  notifications: AppNotification[];
  users: User[]; 
  currentUser: User | null;
  settings: Settings;
};

export enum View {
  Dashboard = 'dashboard',
  Inventory = 'inventory',
  Sales = 'sales',
  Suppliers = 'suppliers',
  AIInsights = 'ai-insights',
  Stocktake = 'stocktake',
  Reports = 'reports',
  Settings = 'settings',
  UserManagement = 'user-management',
  LaunchCenter = 'launch-center'
}
