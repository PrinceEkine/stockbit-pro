
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Product, Sale, Supplier, AppState, User, Settings, AppNotification, SaleItem, SubscriptionPlan, StocktakeItem, ProductReturn, PaymentMethod } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const SETTINGS_KEY = 'stockbit_local_settings';

const mapProfile = (dbProfile: any, authUser: any): User => ({
  id: dbProfile.id,
  email: authUser?.email || dbProfile.email || '',
  name: dbProfile.name || '',
  companyName: (dbProfile.company_name || '').trim(),
  role: dbProfile.role || 'user',
  trialStartDate: dbProfile.trial_start_date || new Date().toISOString(),
  isSubscribed: dbProfile.is_subscribed || false,
  isVerified: !!authUser?.email_confirmed_at, 
  subscriptionExpiry: dbProfile.subscription_expiry,
  parentId: dbProfile.parent_id || undefined, 
  plan: (dbProfile.plan as SubscriptionPlan) || 'beta'
});

export const getTrialStatus = (user: User | null) => {
  if (!user) return { isExpired: false, isSubscribed: false, daysLeft: 60 };
  if (user.isSubscribed) return { isExpired: false, isSubscribed: true, daysLeft: 0 };

  const start = new Date(user.trialStartDate);
  const now = new Date();
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + 60);

  const diffTime = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isExpired: now > expiry,
    isSubscribed: false,
    daysLeft: Math.max(0, daysLeft)
  };
};

export const useStore = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [state, setState] = useState<AppState>({
    products: [],
    sales: [],
    returns: [],
    suppliers: [],
    notifications: [],
    users: [],
    currentUser: null,
    error: null,
    settings: {
      companyName: 'StockBit Store',
      currency: '₦',
      categories: DEFAULT_CATEGORIES,
      lowStockEmailAlerts: true,
      notificationEmail: '',
      isPromoActive: false,
      promoDiscount: 0,
      theme: (localStorage.getItem('stockbit_theme') as 'light' | 'dark') || 'light',
      taxRate: 7.5,
      language: 'en',
      isDynamicPricingActive: false,
      marketplaces: {
        jumia: true,
        konga: false,
        whatsapp: false
      }
    }
  });

  const loadInitialBatch = useCallback(async (userId: string, parentId?: string) => {
    if (!userId) return;
    try {
      const targetId = parentId || userId;
      const [p, s, ret, sup, n] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', targetId),
        supabase.from('sales').select('*').eq('user_id', targetId).order('date', { ascending: false }),
        supabase.from('returns').select('*').eq('user_id', targetId).order('date', { ascending: false }),
        supabase.from('suppliers').select('*').eq('user_id', targetId),
        supabase.from('notifications').select('*').eq('user_id', targetId).order('date', { ascending: false })
      ]);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${targetId},parent_id.eq.${targetId}`);

      setState(prev => ({
        ...prev,
        error: null,
        products: (p.data || []).map(item => ({
          ...item,
          price: Number(item.price) || 0,
          cost_price: Number(item.cost_price) || 0,
          quantity: Number(item.quantity) || 0,
          min_threshold: Number(item.min_threshold) || 0,
          sustainability_score: Number(item.sustainability_score) || 0
        })),
        sales: (s.data || []).map(sale => ({
          ...sale,
          total_price: Number(sale.total_price) || 0,
          total_cost: Number(sale.total_cost) || 0,
          tax_amount: Number(sale.tax_amount) || 0,
          payment_method: (sale.payment_method as PaymentMethod) || 'cash'
        })),
        returns: (ret.data || []).map(r => ({
          ...r,
          product_id: r.product_id,
          product_name: r.product_name
        })),
        suppliers: (sup.data || []),
        notifications: (n.data || []),
        users: (usersData || []).map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role,
          companyName: p.company_name,
          trialStartDate: p.trial_start_date,
          isSubscribed: p.is_subscribed,
          isVerified: true,
          parentId: p.parent_id,
          plan: p.plan || 'beta'
        }))
      }));
    } catch (e: any) {
      console.error("Batch synchronization error:", e);
    }
  }, []);

  const handleInitialDataLoad = useCallback(async (authUser: any) => {
    try {
      setIsLoggedIn(true);
      const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      
      const metadata = authUser.user_metadata || {};
      let user: User;

      if (!profile || profileErr || (metadata.parentId && !profile.parent_id)) {
        const trialExpiry = new Date();
        trialExpiry.setMonth(trialExpiry.getMonth() + 2);

        const repairData = {
          id: authUser.id,
          name: metadata.name || authUser.email.split('@')[0],
          email: authUser.email,
          role: metadata.role || 'user',
          company_name: metadata.companyName || 'New Enterprise',
          parent_id: metadata.parentId || null,
          trial_start_date: new Date().toISOString(),
          plan: 'beta',
          subscription_expiry: trialExpiry.toISOString(),
          is_subscribed: false
        };

        const { data: upserted } = await supabase.from('profiles').upsert(repairData).select().single();
        user = mapProfile(upserted || repairData, authUser);
      } else {
        user = mapProfile(profile, authUser);
      }

      setState(prev => ({ ...prev, currentUser: user, error: null }));
      await loadInitialBatch(user.id, user.parentId);
    } catch (e: any) {
      console.error("Auth init sync failure:", e);
      setState(prev => ({ ...prev, error: "Cloud protocol handshake failed. Please refresh." }));
    } finally {
      setLoading(false);
    }
  }, [loadInitialBatch]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleInitialDataLoad(session.user);
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        if (!isLoggedIn) await handleInitialDataLoad(session.user);
      } else {
        setIsLoggedIn(false);
        setState(prev => ({ 
          ...prev, 
          currentUser: null, 
          products: [], 
          sales: [], 
          suppliers: [],
          returns: [],
          notifications: [],
          error: null 
        }));
        setLoading(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [handleInitialDataLoad, isLoggedIn]);

  const logout = useCallback(async () => {
    setIsLoggedIn(false);
    setState(prev => ({ 
      ...prev, 
      currentUser: null, 
      products: [], 
      sales: [], 
      returns: [], 
      suppliers: [], 
      notifications: [], 
      users: [] 
    }));
    await supabase.auth.signOut();
  }, []);

  return {
    ...state,
    loading,
    isLoggedIn,
    login: (email: string, pass: string) => supabase.auth.signInWithPassword({ email, password: pass }),
    logout,
    register: async (userData: any) => {
      const { inviteId } = userData;
      let role = 'admin';
      let parentId = null;
      let companyName = userData.companyName;

      if (inviteId) {
        const { data: parent, error: pErr } = await supabase.from('profiles').select('id, company_name').eq('id', inviteId).maybeSingle();
        if (pErr || !parent) return { error: { message: "CRITICAL: Invalid Invite ID. Business not found." } };
        
        role = 'staff';
        parentId = parent.id;
        companyName = parent.company_name; 
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email, 
        password: userData.password,
        options: { 
          data: { 
            name: userData.name, 
            companyName: companyName,
            role: role,
            parentId: parentId
          } 
        }
      });
      
      if (error) return { error };
      
      if (data.user) {
        const trialExpiry = new Date();
        trialExpiry.setMonth(trialExpiry.getMonth() + 2);

        await supabase.from('profiles').upsert({ 
          id: data.user.id, 
          name: userData.name, 
          email: userData.email, 
          role: role,
          company_name: companyName, 
          parent_id: parentId, 
          trial_start_date: new Date().toISOString(), 
          plan: 'beta',
          subscription_expiry: trialExpiry.toISOString(),
          is_subscribed: false
        });
      }
      return { success: true };
    },
    verifyOtp: (email: string, token: string, type: 'signup' | 'recovery') => supabase.auth.verifyOtp({ email, token, type }),
    resetPassword: (email: string) => supabase.auth.resetPasswordForEmail(email),
    updatePassword: (newPassword: string) => supabase.auth.updateUser({ password: newPassword }),
    
    updateProduct: async (id: string, updates: Partial<Product>) => {
      if (!state.currentUser) return;
      await supabase.from('products').update({ ...updates, last_updated: new Date().toISOString() }).eq('id', id);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    deleteProduct: async (id: string) => {
      if (!state.currentUser) return;
      await supabase.from('products').delete().eq('id', id);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    addProduct: async (data: any) => {
      if (!state.currentUser) return;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      
      const { error } = await supabase.from('products').insert({
        ...data,
        user_id: ownerId,
        last_updated: new Date().toISOString()
      });
      
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }
      
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    reconcileInventory: async (items: StocktakeItem[]) => {
      if (!state.currentUser) return;
      for (const item of items) {
        await supabase.from('products').update({ quantity: item.physicalQty, last_updated: new Date().toISOString() }).eq('id', item.productId);
      }
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    recordSale: async (items: SaleItem[], customerName?: string, location: string = 'Main Branch', paymentMethod: PaymentMethod = 'cash', status: 'completed' | 'pending' = 'completed') => {
      if (!state.currentUser) return false;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      const subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const tax = subtotal * (state.settings.taxRate / 100);
      
      const { error } = await supabase.from('sales').insert({
        user_id: ownerId, 
        items: items, 
        total_price: subtotal + tax,
        total_cost: items.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0),
        date: new Date().toISOString(), 
        customer_name: customerName || 'Walk-in',
        location: location, 
        tax_amount: tax, 
        payment_method: paymentMethod
      });
      
      if (error) return false;

      for (const i of items) {
        const prod = state.products.find(p => p.id === i.productId);
        if (prod) {
          await supabase.from('products')
            .update({ quantity: Math.max(0, prod.quantity - i.quantity) })
            .eq('id', prod.id);
        }
      }
      
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
      return true;
    },
    recordReturn: async (data: Omit<ProductReturn, 'id' | 'date' | 'user_id'>) => {
      if (!state.currentUser) return;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      await supabase.from('returns').insert({
        user_id: ownerId,
        product_id: data.product_id,
        product_name: data.product_name,
        quantity: data.quantity,
        reason: data.reason,
        refunded: data.refunded,
        location: data.location,
        date: new Date().toISOString()
      });
      const prod = state.products.find(p => p.id === data.product_id);
      if (prod) await supabase.from('products').update({ quantity: prod.quantity + data.quantity }).eq('id', prod.id);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    updateSettings: (updates: Partial<Settings>) => {
      const newSettings = { ...state.settings, ...updates };
      setState(prev => ({ ...prev, settings: newSettings }));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      if (state.currentUser) {
        supabase.from('profiles').update({ settings: newSettings }).eq('id', state.currentUser.id);
      }
    },
    addSupplier: async (data: any) => {
      if (!state.currentUser) return;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      await supabase.from('suppliers').insert({
        ...data,
        user_id: ownerId
      });
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    addStaffMember: async (userData: any) => {
      if (!state.currentUser) return;
      const parentId = state.currentUser.id;
      const { data, error } = await supabase.auth.signUp({
        email: userData.email, password: userData.password,
        options: { 
          data: { 
            name: userData.name, 
            companyName: state.currentUser.companyName,
            role: 'staff',
            parentId: parentId
          } 
        }
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').upsert({ 
          id: data.user.id, name: userData.name, email: userData.email, role: 'staff',
          company_name: state.currentUser.companyName, parent_id: parentId, 
          trial_start_date: new Date().toISOString(), plan: 'beta', is_subscribed: false
        });
      }
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    removeStaffMember: async (id: string) => {
      if (!state.currentUser) return;
      await supabase.from('profiles').delete().eq('id', id);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    assignParentToUser: async (userId: string, parentId: string) => {
      if (!state.currentUser) return;
      const { data: parent } = await supabase.from('profiles').select('company_name').eq('id', parentId).maybeSingle();
      await supabase.from('profiles').update({ parent_id: parentId, role: 'staff', company_name: parent?.company_name }).eq('id', userId);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    activateSubscription: async (plan: SubscriptionPlan, cycle: 'monthly' | 'annual' = 'monthly', userId?: string): Promise<boolean> => {
      const targetId = userId || state.currentUser?.id;
      if (!targetId) return false;
      const expiry = new Date();
      if (cycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
      else expiry.setFullYear(expiry.getFullYear() + 1);
      await supabase.from('profiles').update({ plan, is_subscribed: true, subscription_expiry: expiry.toISOString() }).eq('id', targetId);
      if (state.currentUser) await handleInitialDataLoad({ id: state.currentUser.id, email: state.currentUser.email });
      return true;
    }
  };
};
