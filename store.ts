import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Product, Sale, Supplier, AppState, User, Settings, AppNotification, SaleItem, SubscriptionPlan, StocktakeItem, ProductReturn, PaymentMethod } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const SUPER_ADMIN_EMAILS = [
  'princedagogoekine@gmail.com'
];

const mapProfile = (dbProfile: any, authUser: any): User => ({
  id: dbProfile.id,
  email: authUser?.email || dbProfile.email || '',
  name: dbProfile.name || '',
  companyName: (dbProfile.company_name || '').trim() || 'My StockBit Shop',
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const initialized = useRef(false);

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
      companyName: 'My StockBit Shop',
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
      paystackPublicKey: (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || undefined,
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
      const [p, s, ret, sup, n, prof] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', targetId).limit(1000),
        supabase.from('sales').select('*').eq('user_id', targetId).order('date', { ascending: false }).limit(100),
        supabase.from('returns').select('*').eq('user_id', targetId).order('date', { ascending: false }).limit(50),
        supabase.from('suppliers').select('*').eq('user_id', targetId),
        supabase.from('notifications').select('*').eq('user_id', targetId).order('date', { ascending: false }).limit(20),
        supabase.from('profiles').select('settings').eq('id', userId).maybeSingle()
      ]);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${targetId},parent_id.eq.${targetId}`);

      if (prof.data?.settings) {
        setState(prev => ({ 
          ...prev, 
          settings: { ...prev.settings, ...prof.data.settings } 
        }));
      }

      setState(prev => ({
        ...prev,
        error: null,
        products: (p.data || []).map(item => ({
          ...item,
          price: Number(item.price) || 0,
          cost_price: Number(item.cost_price) || 0,
          quantity: Number(item.quantity) || 0,
          min_threshold: Number(item.min_threshold) || 0,
        })),
        sales: (s.data || []).map(sale => ({
          ...sale,
          items: sale.items || [],
          total_price: Number(sale.total_price) || 0,
          tax_amount: Number(sale.tax_amount) || 0,
        })),
        returns: (ret.data || []),
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
      console.error("Data Load Error:", e);
      setState(prev => ({ ...prev, error: "Network slow. Try clicking 'Start Over' if this persists." }));
    } finally {
      setInitialLoadComplete(true);
    }
  }, []);

  const handleInitialDataLoad = useCallback(async (authUser: any) => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    try {
      // Immediate Transition to prevent the "Entering" hang
      setIsLoggedIn(true);
      setLoading(false);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      
      const userEmail = authUser.email?.toLowerCase() || '';
      const isAdminEmail = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);
      
      const metadata = authUser.user_metadata || {};
      let assignedRole: 'admin' | 'user' | 'staff' = 'user';
      if (isAdminEmail) {
        assignedRole = 'admin';
      } else if (metadata.role === 'staff' || metadata.parentId || (profile && profile.parent_id)) {
        assignedRole = 'staff';
      }

      let user: User;
      if (!profile) {
        const trialExpiry = new Date();
        trialExpiry.setMonth(trialExpiry.getMonth() + 2);
        const repairData = {
          id: authUser.id,
          name: metadata.name || userEmail.split('@')[0],
          email: userEmail,
          role: assignedRole,
          company_name: metadata.companyName || 'My New Shop',
          parent_id: metadata.parentId || null,
          trial_start_date: new Date().toISOString(),
          plan: 'beta',
          subscription_expiry: trialExpiry.toISOString(),
          is_subscribed: false
        };
        await supabase.from('profiles').upsert(repairData);
        user = mapProfile(repairData, authUser);
      } else {
        if (profile.role === 'admin' && !isAdminEmail) {
           const { data: updatedProfile } = await supabase.from('profiles').update({ role: 'user' }).eq('id', authUser.id).select().single();
           user = mapProfile(updatedProfile || profile, authUser);
        } else {
           user = mapProfile(profile, authUser);
        }
      }

      setState(prev => ({ ...prev, currentUser: user, error: null }));
      loadInitialBatch(user.id, user.parentId);
    } catch (e: any) {
      console.error("Auth Load Error:", e);
      setIsLoggedIn(false);
      setLoading(false);
    }
  }, [loadInitialBatch]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let isMounted = true;

    // Faster safety timeout (8 seconds instead of 12)
    const bootTimeout = setTimeout(() => {
      if (isMounted && loading) setLoading(false);
    }, 8000);

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session) await handleInitialDataLoad(session.user);
          else setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && isMounted) {
        await handleInitialDataLoad(session.user);
      } else if (!session && isMounted) {
        setIsLoggedIn(false);
        setInitialLoadComplete(false);
        setState(prev => ({ ...prev, currentUser: null, products: [], sales: [], suppliers: [] }));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, [handleInitialDataLoad]);

  const logout = useCallback(async () => {
    setIsLoggedIn(false);
    setInitialLoadComplete(false);
    setLoading(true);
    setState(prev => ({ ...prev, currentUser: null, products: [], sales: [], suppliers: [], error: null }));
    await supabase.auth.signOut();
    setLoading(false);
  }, []);

  return {
    ...state,
    loading,
    initialLoadComplete,
    isLoggedIn,
    login: (email: string, pass: string) => supabase.auth.signInWithPassword({ email: email.toLowerCase(), password: pass }),
    logout,
    register: async (userData: any) => {
      const email = userData.email.toLowerCase();
      const isAdminEmail = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email);
      const assignedRole = isAdminEmail ? 'admin' : (userData.inviteId ? 'staff' : 'user');
      const { data, error } = await supabase.auth.signUp({
        email, 
        password: userData.password,
        options: { 
          emailRedirectTo: window.location.origin,
          data: { 
            name: userData.name, 
            companyName: userData.companyName, 
            role: assignedRole, 
            parentId: userData.inviteId || null 
          } 
        }
      });
      if (error) return { error };
      if (data.user) {
        await supabase.from('profiles').upsert({ 
          id: data.user.id, 
          name: userData.name, 
          email, 
          role: assignedRole, 
          company_name: userData.companyName, 
          parent_id: userData.inviteId || null, 
          trial_start_date: new Date().toISOString(), 
          plan: 'beta', 
          is_subscribed: false 
        });
      }
      return { success: true };
    },
    updateProduct: async (id: string, updates: Partial<Product>) => {
      if (!state.currentUser) return;
      await supabase.from('products').update({ ...updates, last_updated: new Date().toISOString() }).eq('id', id);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    addProduct: async (data: any) => {
      if (!state.currentUser) return;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      await supabase.from('products').insert({ ...data, user_id: ownerId, last_updated: new Date().toISOString() });
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    deleteProduct: async (id: string) => {
      if (!state.currentUser) return;
      await supabase.from('products').delete().eq('id', id);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    recordSale: async (items: SaleItem[], customerName?: string, location: string = 'Main Branch', paymentMethod: PaymentMethod = 'cash', status: 'completed' | 'pending' = 'completed') => {
      if (!state.currentUser) return false;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      const subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const tax = subtotal * (state.settings.taxRate / 100);
      
      const { data: saleData, error: saleError } = await supabase.from('sales').insert({ 
        user_id: ownerId, 
        items, 
        total_price: subtotal + tax, 
        total_cost: items.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0), 
        date: new Date().toISOString(), 
        customer_name: customerName || 'Walk-in', 
        location, 
        tax_amount: tax, 
        payment_method: paymentMethod 
      }).select().single();
      
      if (saleError) {
        console.error("Sale Recording Error:", saleError);
        return false;
      }
      
      // Fast multi-product quantity update
      const updatePromises = items.map(async (i) => {
        const prod = state.products.find(p => p.id === i.productId);
        if (prod) {
          return supabase.from('products').update({ 
            quantity: Math.max(0, prod.quantity - i.quantity),
            last_updated: new Date().toISOString()
          }).eq('id', prod.id);
        }
      });
      
      await Promise.all(updatePromises);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
      return true;
    },
    reconcileInventory: async (items: StocktakeItem[]) => {
      if (!state.currentUser) return;
      
      // Batch update stock levels
      const syncPromises = items.map(item => 
        supabase.from('products').update({ 
          quantity: item.physicalQty,
          last_updated: new Date().toISOString()
        }).eq('id', item.productId)
      );
      
      await Promise.all(syncPromises);
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    recordReturn: async (data: Omit<ProductReturn, 'id' | 'date' | 'user_id'>) => {
      if (!state.currentUser) return;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      await supabase.from('returns').insert({ ...data, user_id: ownerId, date: new Date().toISOString() });
      const prod = state.products.find(p => p.id === data.product_id);
      if (prod) {
        await supabase.from('products').update({ quantity: prod.quantity + data.quantity }).eq('id', prod.id);
      }
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    addSupplier: async (data: Omit<Supplier, 'id' | 'user_id'>) => {
      if (!state.currentUser) return;
      const ownerId = state.currentUser.parentId || state.currentUser.id;
      await supabase.from('suppliers').insert({ ...data, user_id: ownerId });
      await loadInitialBatch(state.currentUser.id, state.currentUser.parentId);
    },
    addStaffMember: async (userData: any) => {
      if (!state.currentUser) return;
      const { data, error } = await supabase.auth.signUp({
        email: userData.email, password: userData.password,
        options: { 
          emailRedirectTo: window.location.origin,
          data: { name: userData.name, companyName: state.currentUser.companyName, role: 'staff', parentId: state.currentUser.id } 
        }
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, name: userData.name, email: userData.email, role: 'staff', company_name: state.currentUser.companyName, parent_id: state.currentUser.id, trial_start_date: new Date().toISOString(), plan: 'beta', is_subscribed: false });
      }
      await loadInitialBatch(state.currentUser.id);
    },
    removeStaffMember: async (id: string) => {
      if (!state.currentUser) return;
      await supabase.from('profiles').delete().eq('id', id);
      await loadInitialBatch(state.currentUser.id);
    },
    resetPassword: async (email: string) => {
      return await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/#update_password` });
    },
    assignParentToUser: async (userId: string, parentId: string) => {
      await supabase.from('profiles').update({ parent_id: parentId, role: 'staff' }).eq('id', userId);
      if (state.currentUser) await loadInitialBatch(state.currentUser.id);
    },
    updateSettings: async (updates: Partial<Settings>) => {
      const newSettings = { ...state.settings, ...updates };
      setState(prev => ({ ...prev, settings: newSettings }));
      
      if (state.currentUser) {
        await supabase.from('profiles').update({ settings: newSettings }).eq('id', state.currentUser.id);
      }
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