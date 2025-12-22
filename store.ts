import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Product, Sale, Supplier, AppState, User, Settings, AppNotification, SaleItem, StocktakeItem } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const mapProfile = (data: any): User => ({
  id: data.id,
  email: data.email,
  name: data.name,
  companyName: data.company_name,
  role: data.role,
  trialStartDate: data.trial_start_date,
  isSubscribed: data.is_subscribed,
  isVerified: data.is_verified,
  subscriptionExpiry: data.subscription_expiry
});

export const useStore = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [state, setState] = useState<AppState>({
    products: [],
    sales: [],
    suppliers: [],
    notifications: [],
    users: [],
    currentUser: null,
    settings: {
      companyName: 'StockBit Pro Store',
      currency: '₦',
      categories: DEFAULT_CATEGORIES,
      lowStockEmailAlerts: true,
      notificationEmail: ''
    }
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleInitialDataLoad(session.user.id);
      } else {
        setIsLoggedIn(false);
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleInitialDataLoad(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setState(prev => ({ ...prev, currentUser: null, products: [], sales: [], suppliers: [], notifications: [] }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInitialDataLoad = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setState(prev => ({ ...prev, currentUser: mapProfile(profile) }));
      setIsLoggedIn(true);
      await loadInitialBatch(userId);
      setupRealtime(userId);
    }
    setLoading(false);
  };

  const loadInitialBatch = async (userId: string) => {
    const [p, s, sup, set, n] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', userId),
      supabase.from('sales').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('suppliers').select('*').eq('user_id', userId),
      supabase.from('settings').select('*').eq('user_id', userId).single(),
      supabase.from('notifications').select('*').eq('user_id', userId).order('date', { ascending: false })
    ]);

    setState(prev => ({
      ...prev,
      products: p.data || [],
      sales: s.data || [],
      suppliers: sup.data || [],
      settings: set.data ? {
        companyName: set.data.company_name,
        currency: set.data.currency,
        categories: set.data.categories,
        lowStockEmailAlerts: set.data.low_stock_email_alerts,
        notificationEmail: set.data.notification_email
      } : prev.settings,
      notifications: n.data || []
    }));
  };

  const setupRealtime = (userId: string) => {
    supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${userId}` },
        () => loadInitialBatch(userId) // Re-fetch for consistency or optimize payload
      )
      .subscribe();
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const register = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          companyName: userData.companyName
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true, needsVerification: !data.session };
  };

  const logout = () => supabase.auth.signOut();

  const addProduct = async (product: Omit<Product, 'id' | 'lastUpdated'>) => {
    if (!state.currentUser) return;
    await supabase.from('products').insert({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      cost_price: product.costPrice,
      quantity: product.quantity,
      min_threshold: product.minThreshold,
      supplier_id: product.supplierId || null,
      batch_number: product.batchNumber,
      expiry_date: product.expiryDate || null,
      user_id: state.currentUser.id,
      last_updated: new Date().toISOString()
    });
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!state.currentUser) return;
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.sku) dbUpdates.sku = updates.sku;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.minThreshold !== undefined) dbUpdates.min_threshold = updates.minThreshold;
    if (updates.batchNumber !== undefined) dbUpdates.batch_number = updates.batchNumber;
    if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate || null;
    
    dbUpdates.last_updated = new Date().toISOString();
    await supabase.from('products').update(dbUpdates).eq('id', id);
  };

  const deleteProduct = async (id: string) => {
    if (!state.currentUser) return;
    await supabase.from('products').delete().eq('id', id);
  };

  const recordSale = async (items: SaleItem[]) => {
    if (!state.currentUser) return false;
    
    const totalPrice = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const totalCost = items.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);
    
    const { error } = await supabase.from('sales').insert({
      user_id: state.currentUser.id,
      items,
      total_price: totalPrice,
      total_cost: totalCost,
      date: new Date().toISOString()
    });

    if (error) return false;

    // Trigger local updates via realtime or manual re-fetch
    return true;
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!state.currentUser) return;
    const dbUpdates: any = {};
    if (updates.companyName) dbUpdates.company_name = updates.companyName;
    if (updates.currency) dbUpdates.currency = updates.currency;
    if (updates.categories) dbUpdates.categories = updates.categories;
    if (updates.lowStockEmailAlerts !== undefined) dbUpdates.low_stock_email_alerts = updates.lowStockEmailAlerts;
    if (updates.notificationEmail !== undefined) dbUpdates.notification_email = updates.notificationEmail;

    await supabase.from('settings').update(dbUpdates).eq('user_id', state.currentUser.id);
  };

  const markNotificationRead = async (id: string) => {
    if (!state.currentUser) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const clearNotifications = async () => {
    if (!state.currentUser) return;
    await supabase.from('notifications').delete().eq('user_id', state.currentUser.id);
  };

  const reconcileInventory = async (items: StocktakeItem[]) => {
    if (!state.currentUser) return;
    for (const item of items) {
      if (item.systemQty !== item.physicalQty) {
        await updateProduct(item.productId, { quantity: item.physicalQty });
      }
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (!state.currentUser) return;
    await supabase.from('suppliers').insert({ 
      name: supplier.name,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      category: supplier.category,
      user_id: state.currentUser.id 
    });
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!state.currentUser) return;
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.contactName) dbUpdates.contact_name = updates.contactName;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.category) dbUpdates.category = updates.category;

    await supabase.from('suppliers').update(dbUpdates).eq('id', id);
  };

  const deleteSupplier = async (id: string) => {
    if (!state.currentUser) return;
    await supabase.from('suppliers').delete().eq('id', id);
  };

  const addCategory = async (cat: string) => {
    if (!state.currentUser) return;
    const newCategories = [...state.settings.categories, cat];
    await updateSettings({ categories: newCategories });
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return !error;
  };

  return {
    ...state,
    isLoggedIn,
    loading,
    login,
    register,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    recordSale,
    updateSettings,
    requestPasswordReset,
    markNotificationRead,
    clearNotifications,
    reconcileInventory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCategory
  };
};