import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Product, Sale, Supplier, AppState, User, Settings, AppNotification, SaleItem, SubscriptionPlan, StocktakeItem, ProductReturn, PaymentMethod } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const SUPER_ADMIN_EMAILS = [
  'princedagogoekine@gmail.com'
];

/**
 * Maps database profile record to the User type used in the frontend.
 */
const mapProfile = (dbProfile: any): User => ({
  id: dbProfile.id,
  email: dbProfile.email,
  name: dbProfile.name || '',
  companyName: dbProfile.company_name || '',
  role: dbProfile.role || 'user',
  trialStartDate: dbProfile.trial_start_date || new Date().toISOString(),
  subscriptionExpiry: dbProfile.subscription_expiry,
  isSubscribed: dbProfile.is_subscribed || false,
  isVerified: dbProfile.is_verified || false,
  parentId: dbProfile.parent_id,
  plan: dbProfile.plan
});

/**
 * Calculates trial status for a user based on their registration date.
 * Assumes a 60-day trial period.
 */
export const getTrialStatus = (user: User | null) => {
  if (!user) return { isSubscribed: false, daysLeft: 0 };
  if (user.isSubscribed) return { isSubscribed: true, daysLeft: 0 };
  
  const start = new Date(user.trialStartDate);
  const now = new Date();
  const trialDays = 60; 
  const diff = now.getTime() - start.getTime();
  const daysUsed = Math.floor(diff / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, trialDays - daysUsed);
  
  return { isSubscribed: false, daysLeft };
};

/**
 * Main application store hook for managing global state and Supabase data operations.
 */
export const useStore = () => {
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Settings>({
    companyName: 'StockBit Shop',
    currency: '₦',
    categories: DEFAULT_CATEGORIES,
    lowStockEmailAlerts: true,
    notificationEmail: '',
    isPromoActive: false,
    promoDiscount: 0,
    theme: 'light',
    taxRate: 7.5,
    language: 'en',
    isDynamicPricingActive: false,
    marketplaces: { jumia: false, konga: false, whatsapp: false }
  });
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!currentUser;

  /**
   * Loads all application data for the authenticated user or their parent business.
   */
  const loadData = useCallback(async (userId: string, isStaff: boolean, parentId?: string) => {
    setLoading(true);
    const targetUserId = isStaff ? parentId : userId;
    
    if (!targetUserId) {
      setLoading(false);
      setInitialLoadComplete(true);
      return;
    }

    try {
      const [prodRes, saleRes, suppRes, retRes, noteRes, settingsRes, profilesRes] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', targetUserId).order('name'),
        supabase.from('sales').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('suppliers').select('*').eq('user_id', targetUserId).order('name'),
        supabase.from('returns').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('settings').select('*').eq('user_id', targetUserId).single(),
        supabase.from('profiles').select('*')
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (saleRes.data) setSales(saleRes.data);
      if (suppRes.data) setSuppliers(suppRes.data);
      if (retRes.data) setReturns(retRes.data);
      if (noteRes.data) setNotifications(noteRes.data);
      if (settingsRes.data) setSettings(settingsRes.data.config || settings);
      if (profilesRes.data) setUsers(profilesRes.data.map(mapProfile));
      
    } catch (err) {
      console.error("Data load failed", err);
      setError("Failed to load shop data. Please check your connection.");
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [settings]);

  // Initial authentication check and session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            const user = mapProfile(data);
            setCurrentUser(user);
            loadData(user.id, user.role === 'staff', user.parentId);
          } else {
            setLoading(false);
            setInitialLoadComplete(true);
          }
        });
      } else {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            const user = mapProfile(data);
            setCurrentUser(user);
            loadData(user.id, user.role === 'staff', user.parentId);
          }
        });
      } else {
        setCurrentUser(null);
        setInitialLoadComplete(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  // Authentication Actions
  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { data, error };
  };

  const register = async ({ email, password, name, companyName, inviteId }: any) => {
    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: { full_name: name } } 
    });
    
    if (authError) return { error: authError };
    if (!data.user) return { error: new Error("Registration failed") };

    const { error: profileError } = await supabase.from('profiles').insert([{
      id: data.user.id,
      email,
      name,
      company_name: companyName,
      role: inviteId ? 'staff' : 'admin',
      parent_id: inviteId || null,
      trial_start_date: new Date().toISOString()
    }]);

    if (profileError) return { error: profileError };
    return { data };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProducts([]);
    setSales([]);
    setSuppliers([]);
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  // Business Actions
  const updateSettings = async (updates: Partial<Settings>) => {
    // UPDATED: Allow local settings updates even if not logged in
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    // Only attempt Supabase sync if user is authenticated
    if (currentUser) {
      const targetId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
      if (targetId) {
        await supabase.from('settings').upsert({ 
          user_id: targetId, 
          config: newSettings 
        });
      }
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'last_updated' | 'created_at' | 'user_id'>) => {
    if (!currentUser) return;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    const { data, error } = await supabase.from('products').insert([{ ...product, user_id: userId }]).select().single();
    if (data) setProducts(prev => [...prev, data]);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (!error) setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(prev => prev.filter(p => p.id !== id));
  };

  const recordSale = async (items: SaleItem[], customerName?: string, location?: string, paymentMethod: PaymentMethod = 'cash', status: 'completed' | 'pending' = 'completed') => {
    if (!currentUser) return false;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    
    const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const totalCost = items.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
    const taxAmount = totalPrice * (settings.taxRate / 100);

    const saleRecord = {
      user_id: userId,
      items,
      total_price: totalPrice + taxAmount,
      total_cost: totalCost,
      tax_amount: taxAmount,
      customer_name: customerName,
      location: location || 'Main',
      payment_method: paymentMethod,
      status,
      date: new Date().toISOString()
    };

    const { data, error } = await supabase.from('sales').insert([saleRecord]).select().single();
    
    if (data) {
      setSales(prev => [data, ...prev]);
      // Update inventory levels
      for (const item of items) {
        const p = products.find(prod => prod.id === item.productId);
        if (p) {
          await updateProduct(p.id, { quantity: p.quantity - item.quantity });
        }
      }
      return true;
    }
    return false;
  };

  const recordReturn = async (data: Omit<ProductReturn, 'id' | 'date' | 'user_id'>) => {
    if (!currentUser) return;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    const { data: ret, error } = await supabase.from('returns').insert([{ ...data, user_id: userId }]).select().single();
    if (ret) {
      setReturns(prev => [ret, ...prev]);
      const p = products.find(prod => prod.id === data.product_id);
      if (p) await updateProduct(p.id, { quantity: p.quantity + data.quantity });
    }
  };

  const reconcileInventory = async (items: StocktakeItem[]) => {
    for (const item of items) {
      if (item.systemQty !== item.physicalQty) {
        await updateProduct(item.productId, { quantity: item.physicalQty });
      }
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'user_id'>) => {
    if (!currentUser) return;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    const { data, error } = await supabase.from('suppliers').insert([{ ...supplier, user_id: userId }]).select().single();
    if (data) setSuppliers(prev => [...prev, data]);
  };

  const addStaffMember = async (staffData: any) => {
    if (!currentUser) return;
    const { error } = await register({ ...staffData, inviteId: currentUser.id });
    if (error) throw error;
  };

  const removeStaffMember = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const activateSubscription = async (plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => {
    if (!currentUser) return;
    const expiry = new Date();
    if (cycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
    else expiry.setFullYear(expiry.getFullYear() + 1);

    const updates = { is_subscribed: true, plan, subscription_expiry: expiry.toISOString() };
    const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
    if (!error) setCurrentUser({ ...currentUser, isSubscribed: true, plan, subscriptionExpiry: expiry.toISOString() });
  };

  return {
    loading, initialLoadComplete, currentUser, products, sales, returns, suppliers, notifications, users, settings, error, isLoggedIn,
    login, register, resetPassword, logout, updateSettings, addProduct, updateProduct, deleteProduct, recordSale, reconcileInventory, recordReturn, addSupplier, addStaffMember, removeStaffMember, activateSubscription
  };
};