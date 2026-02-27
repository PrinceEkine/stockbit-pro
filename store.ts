
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Product, Sale, Supplier, AppState, User, Settings, AppNotification, SaleItem, SubscriptionPlan, StocktakeItem, ProductReturn, PaymentMethod } from './types';
import { DEFAULT_CATEGORIES } from './constants';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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
    paystackPublicKey: process.env.VITE_PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    marketplaces: { jumia: false, konga: false, whatsapp: false }
  });
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!currentUser;

  const loadData = useCallback(async (userId: string, isStaff: boolean, parentId?: string) => {
    if (!userId) {
      setLoading(false);
      setInitialLoadComplete(true);
      return;
    }

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
        supabase.from('profiles').select('*').or(`id.eq.${targetUserId},parent_id.eq.${targetUserId}`)
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (saleRes.data) setSales(saleRes.data);
      if (suppRes.data) setSuppliers(suppRes.data);
      if (retRes.data) setReturns(retRes.data);
      if (noteRes.data) setNotifications(noteRes.data);
      if (settingsRes.data) {
        const dbConfig = settingsRes.data.config || {};
        setSettings(prev => ({
          ...prev,
          ...dbConfig,
          paystackPublicKey: dbConfig.paystackPublicKey || process.env.VITE_PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''
        }));
      }
      if (profilesRes.data) setUsers(profilesRes.data.map(mapProfile));
      
    } catch (err) {
      console.error("Data load failed", err);
      setError("Failed to load shop data. Please check your connection.");
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const targetUserId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    if (!targetUserId) return;

    const productChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${targetUserId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => prev.some(p => p.id === payload.new.id) ? prev : [...prev, payload.new as Product]);
        }
        if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        }
        if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id === payload.old.id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales', filter: `user_id=eq.${targetUserId}` }, (payload) => {
        setSales(prev => prev.some(s => s.id === payload.new.id) ? prev : [payload.new as Sale, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn("Session retrieval error:", error.message);
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_grant')) {
          supabase.auth.signOut();
        }
        setLoading(false);
        setInitialLoadComplete(true);
        return;
      }

      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(async ({ data, error: profileError }) => {
          if (data) {
            let user = mapProfile(data);
            
            // If staff, fetch owner's company name for display
            if (user.role === 'staff' && user.parentId) {
              const { data: parentData } = await supabase.from('profiles').select('company_name').eq('id', user.parentId).single();
              if (parentData) {
                user.companyName = parentData.company_name;
              }
            }
            
            setCurrentUser(user);
            loadData(user.id, user.role === 'staff', user.parentId);
          } else if (profileError && profileError.code === 'PGRST116') {
            // Profile missing - create it from metadata
            const metadata = session.user.user_metadata;
            const newProfile = {
              id: session.user.id,
              email: session.user.email,
              name: metadata.full_name || '',
              company_name: metadata.company_name || '',
              role: metadata.role || 'user',
              parent_id: metadata.parent_id || null,
              trial_start_date: new Date().toISOString()
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();
            
            if (!createError && createdProfile) {
              const user = mapProfile(createdProfile);
              setCurrentUser(user);
              loadData(user.id, user.role === 'staff', user.parentId);
            } else {
              console.error("Profile auto-creation failed", createError);
              setLoading(false);
              setInitialLoadComplete(true);
            }
          } else {
            setLoading(false);
            setInitialLoadComplete(true);
          }
        });
      } else {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }).catch(() => {
      setLoading(false);
      setInitialLoadComplete(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setProducts([]);
        setSales([]);
        setSuppliers([]);
        setInitialLoadComplete(true);
        return;
      }

      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(async ({ data, error: profileError }) => {
          if (data) {
            let user = mapProfile(data);
            
            // If staff, fetch owner's company name for display
            if (user.role === 'staff' && user.parentId) {
              const { data: parentData } = await supabase.from('profiles').select('company_name').eq('id', user.parentId).single();
              if (parentData) {
                user.companyName = parentData.company_name;
              }
            }
            
            setCurrentUser(user);
            loadData(user.id, user.role === 'staff', user.parentId);
          } else if (profileError && profileError.code === 'PGRST116') {
             // Profile missing - create it from metadata
             const metadata = session.user.user_metadata;
             const newProfile = {
               id: session.user.id,
               email: session.user.email,
               name: metadata.full_name || '',
               company_name: metadata.company_name || '',
               role: metadata.role || 'user',
               parent_id: metadata.parent_id || null,
               trial_start_date: new Date().toISOString()
             };
             
             const { data: createdProfile, error: createError } = await supabase
               .from('profiles')
               .insert([newProfile])
               .select()
               .single();
             
             if (!createError && createdProfile) {
               const user = mapProfile(createdProfile);
               setCurrentUser(user);
               loadData(user.id, user.role === 'staff', user.parentId);
             }
          }
        });
      } else {
        setCurrentUser(null);
        setInitialLoadComplete(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  const login = useCallback(async (email: string, pass: string) => {
    return await supabase.auth.signInWithPassword({ email, password: pass });
  }, []);

  const register = useCallback(async ({ email, password, name, companyName, inviteId }: any) => {
    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { 
        data: { 
          full_name: name,
          company_name: companyName,
          role: inviteId ? 'staff' : 'user',
          parent_id: inviteId || null
        } 
      } 
    });
    
    if (authError) return { error: authError };
    return { data };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return await supabase.auth.updateUser({ password: newPassword });
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setCurrentUser(null);
      setProducts([]);
      setSales([]);
      setSuppliers([]);
      setNotifications([]);
      setUsers([]);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#update_password`
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      if (currentUser) {
        const targetId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
        if (targetId) {
          supabase.from('settings').upsert({ 
            user_id: targetId, 
            config: newSettings 
          }).then(({ error }) => {
            if (error) console.error("Settings sync error:", error);
          });
        }
      }
      return newSettings;
    });
  }, [currentUser]);

  const addProduct = async (product: Omit<Product, 'id' | 'last_updated' | 'created_at' | 'user_id'>) => {
    if (!currentUser) return;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    if (!userId) return;
    const { data, error } = await supabase.from('products').insert([{ ...product, user_id: userId }]).select().single();
    if (!error && data) {
      setProducts(prev => [...prev, data]);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (!error && data) {
      setProducts(prev => prev.map(p => p.id === id ? data : p));
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const recordSale = async (items: SaleItem[], customerName?: string, location?: string, paymentMethod: PaymentMethod = 'cash') => {
    if (!currentUser) return false;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    
    if (!userId) {
      console.error("Critical Failure: No target business owner ID found for transaction.");
      return false;
    }

    const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const totalCost = items.reduce((sum, i) => sum + ((i.costPrice || 0) * i.quantity), 0);
    const taxAmount = totalPrice * (settings.taxRate / 100);

    const saleRecord = {
      user_id: userId,
      items,
      total_price: totalPrice + taxAmount,
      total_cost: totalCost,
      tax_amount: taxAmount,
      customer_name: customerName || 'Walk-in',
      location: location || 'Main Terminal',
      payment_method: paymentMethod,
      is_checked: true,
      is_archived: false,
      date: new Date().toISOString()
    };

    const { data: newSale, error: insertError } = await supabase.from('sales').insert([saleRecord]).select().single();
    
    if (insertError) {
      console.error("Sale Insert Error:", insertError.message, insertError.details);
      return false;
    }

    // Success - Update local sales state instantly
    if (newSale) {
      setSales(prev => [newSale, ...prev]);
    }

    // Success - Decrease inventory local state and DB
    for (const item of items) {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        const newQty = p.quantity - item.quantity;
        // Optimistic UI for products
        setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, quantity: newQty } : prod));
        // Update DB
        await supabase.from('products').update({ quantity: newQty }).eq('id', p.id);
      }
    }
    return true;
  };

  const recordReturn = async (data: Omit<ProductReturn, 'id' | 'date' | 'user_id'>) => {
    if (!currentUser) return;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    if (!userId) return;
    const { data: ret, error } = await supabase.from('returns').insert([{ ...data, user_id: userId }]).select().single();
    if (!error && ret) {
      setReturns(prev => [ret, ...prev]);
      const p = products.find(prod => prod.id === data.product_id);
      if (p) {
        const newQty = p.quantity + data.quantity;
        setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, quantity: newQty } : prod));
        await supabase.from('products').update({ quantity: newQty }).eq('id', p.id);
      }
    }
  };

  const reconcileInventory = async (items: StocktakeItem[]) => {
    for (const item of items) {
      if (item.systemQty !== item.physicalQty) {
        // Update local state first
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, quantity: item.physicalQty } : p));
        // Update DB
        await supabase.from('products').update({ quantity: item.physicalQty }).eq('id', item.productId);
      }
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'user_id'>) => {
    if (!currentUser) return;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    if (!userId) return;
    const { data, error } = await supabase.from('suppliers').insert([{ ...supplier, user_id: userId }]).select().single();
    if (!error && data) {
      setSuppliers(prev => [...prev, data]);
    }
  };

  const addStaffMember = async (staffData: any) => {
    if (!currentUser) return;
    const { error } = await register({ ...staffData, inviteId: currentUser.id });
    if (error) throw error;
  };

  const removeStaffMember = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
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
    loading, initialLoadComplete, currentUser, products, sales, returns, suppliers, notifications, users, settings, error, isLoggedIn, isOnline,
    login, register, resetPassword, updatePassword, logout, updateSettings, addProduct, updateProduct, deleteProduct, recordSale, reconcileInventory, recordReturn, addSupplier, addStaffMember, removeStaffMember, activateSubscription
  };
};
