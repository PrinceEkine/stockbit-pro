
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Product, Sale, Supplier, AppState, User, Settings, AppNotification, SaleItem, SubscriptionPlan, StocktakeItem, ProductReturn, PaymentMethod } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const mapProfile = (dbProfile: any): User => {
  // For old users without a trial_start_date, we use created_at.
  // If created_at is also missing, we use a very old date to ensure expiration 
  // rather than a fresh trial, as per user request for "old users".
  const fallbackDate = "2023-01-01T00:00:00Z";
  
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    name: dbProfile.name || '',
    companyName: dbProfile.company_name || '',
    role: dbProfile.role || 'user',
    trialStartDate: dbProfile.trial_start_date || dbProfile.created_at || fallbackDate,
    subscriptionExpiry: dbProfile.subscription_expiry,
    isSubscribed: dbProfile.is_subscribed || false,
    isVerified: dbProfile.is_verified || false,
    parentId: dbProfile.parent_id,
    plan: dbProfile.plan
  };
};

export const getTrialStatus = (user: User | null) => {
  const expiredResult = { isSubscribed: false, daysLeft: 0, isExpired: true };
  
  if (!user) return { isSubscribed: false, daysLeft: 0, isExpired: false };
  if (user.isSubscribed) return { isSubscribed: true, daysLeft: 0, isExpired: false };
  
  const start = new Date(user.trialStartDate);
  const now = new Date();
  
  if (isNaN(start.getTime())) return expiredResult;

  const trialDays = 60; // 2-month (60-day) free trial, matching the advertised plan
  const diff = now.getTime() - start.getTime();
  const daysUsed = Math.floor(diff / (1000 * 60 * 60 * 24));

  // CRITICAL: If the full trial window has been used, it's expired.
  if (daysUsed >= trialDays) return expiredResult;

  const daysLeft = Math.max(0, trialDays - daysUsed);
  
  // If daysLeft is 0, it's also expired.
  if (daysLeft <= 0) return expiredResult;
  
  return { isSubscribed: false, daysLeft, isExpired: false };
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
  const lastLoadedUser = useRef<string | null>(null);
  const isDataLoading = useRef(false);

  const isLoggedIn = !!currentUser;

  const loadData = useCallback(async (userId: string, isStaff: boolean, parentId?: string) => {
    if (!userId || isDataLoading.current) return;
    
    // Prevent redundant loads for the same user
    if (lastLoadedUser.current === userId) return;

    isDataLoading.current = true;
    setLoading(true);
    const targetUserId = isStaff ? parentId : userId;
    
    if (!targetUserId) {
      setLoading(false);
      setInitialLoadComplete(true);
      isDataLoading.current = false;
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
        const dbData = settingsRes.data;
        setSettings(prev => {
          const merged = {
            ...prev,
            companyName: dbData.company_name || prev.companyName,
            currency: dbData.currency || prev.currency,
            categories: dbData.categories || prev.categories,
            lowStockEmailAlerts: dbData.low_stock_email_alerts ?? prev.lowStockEmailAlerts,
            notificationEmail: dbData.notification_email || prev.notificationEmail,
            // Fallback for fields that might not be in their specific table yet
            language: dbData.language || prev.language,
            theme: dbData.theme || prev.theme,
            taxRate: dbData.tax_rate ?? prev.taxRate
          };
          localStorage.setItem('stockbit_settings_v1', JSON.stringify(merged));
          return merged;
        });
      } else {
        const local = localStorage.getItem('stockbit_settings_v1');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setSettings(prev => ({ ...prev, ...parsed }));
          } catch(e) {
            console.error("Local settings parse failed", e);
          }
        }
      }
      if (profilesRes.data) setUsers(profilesRes.data.map(mapProfile));
      
      lastLoadedUser.current = userId;
    } catch (err) {
      console.error("Data load failed", err);
      setError("Failed to load shop data. Please check your connection.");
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
      isDataLoading.current = false;
    }
  }, []); // Removed initialLoadComplete dependency to avoid loops

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

    const savedFirebaseEmail = localStorage.getItem('stockbit_firebase_email');
    if (savedFirebaseEmail) {
      (async () => {
        try {
          const { data, error } = await supabase.from('profiles').select('*').eq('email', savedFirebaseEmail).single();
          if (data && !error) {
            let user = mapProfile(data);
            
            if (user.role === 'staff' && user.parentId) {
              const { data: parentData } = await supabase.from('profiles').select('company_name').eq('id', user.parentId).single();
              if (parentData) {
                user.companyName = parentData.company_name;
              }
            }
            
            setCurrentUser(user);
            await loadData(user.id, user.role === 'staff', user.parentId);
          } else {
            localStorage.removeItem('stockbit_firebase_email');
          }
        } catch (err) {
          console.error("Failed to restore firebase email session:", err);
        } finally {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      })();
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

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
            try {
              const { auth } = await import('./firebase');
              if (auth.currentUser) {
                await setDoc(doc(db, "profiles", data.id), data, { merge: true });
              }
            } catch (err) {
              // Firestore sync optional
            }
            loadData(user.id, user.role === 'staff', user.parentId);
          } else if (profileError && profileError.code === 'PGRST116') {
            // Profile missing - create it from metadata
            const metadata = session.user.user_metadata || {};
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
            try {
              const { auth } = await import('./firebase');
              if (auth.currentUser) {
                await setDoc(doc(db, "profiles", data.id), data, { merge: true });
              }
            } catch (err) {
              // Firestore sync optional
            }
            loadData(user.id, user.role === 'staff', user.parentId);
          } else if (profileError && profileError.code === 'PGRST116') {
             // Profile missing - create it from metadata
             const metadata = session.user.user_metadata || {};
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

  const loginWithGoogle = useCallback(async (customEmail?: string) => {
    let email = '';
    let name = '';

    try {
      const { signInWithGoogle } = await import('./firebase');
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser && firebaseUser.email) {
        email = firebaseUser.email;
        name = firebaseUser.displayName || 'Google Merchant';
      }
    } catch (err: any) {
      console.warn("Google Sign-In failed or cancelled:", err);
      
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request' || err?.message?.includes('popup-closed-by-user')) {
        throw new Error("Sign-in window was closed. Please try signing in again.");
      }
      if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked')) {
        throw new Error("Sign-in pop-up was blocked by your browser. Please allow pop-ups for this site and try again.");
      }
      if (customEmail) {
        email = customEmail;
        name = customEmail.split('@')[0];
      } else {
        throw new Error(err?.message || "Failed to sign in with Google. Please try again.");
      }
    }

    if (!email) {
      throw new Error("No user email returned from Google authentication.");
    }

    // 1. Check if profile already exists in Supabase
    const { data: existingProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      // Profile exists! Log them in.
      const user = mapProfile(existingProfile);
      setCurrentUser(user);
      localStorage.setItem('stockbit_firebase_email', email);
      
      try {
        const { auth } = await import('./firebase');
        if (auth.currentUser) {
          await setDoc(doc(db, "profiles", existingProfile.id), existingProfile, { merge: true });
        }
      } catch (err) {
        // Firestore sync optional
      }
      await loadData(user.id, user.role === 'staff', user.parentId);
      return { user };
    } else {
      // 2. Profile missing - create it with deterministic UUID helper
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const newId = generateUUID();
      const newProfile = {
        id: newId,
        email: email,
        name: name || 'Google Merchant',
        company_name: (name || 'Google Merchant') + " Shop",
        role: 'user',
        parent_id: null,
        trial_start_date: new Date().toISOString()
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error("Firebase Sign-In Profile Creation failed", createError);
        throw createError;
      }

      const user = mapProfile(createdProfile);
      setCurrentUser(user);
      localStorage.setItem('stockbit_firebase_email', email);
      
      try {
        const { auth } = await import('./firebase');
        if (auth.currentUser) {
          await setDoc(doc(db, "profiles", createdProfile.id), createdProfile);
        }
      } catch (err) {
        // Firestore sync optional
      }
      await loadData(user.id, user.role === 'staff', user.parentId);
      return { user };
    }
  }, [loadData]);

  const register = useCallback(async ({ email, password, name, companyName, inviteId }: any) => {
    // If joining as staff, verify the owner's Invite ID exists before creating the account
    // so team members are never orphaned under a non-existent business.
    if (inviteId) {
      const { data: owner, error: ownerError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', inviteId)
        .maybeSingle();

      if (ownerError) {
        // A malformed (non-UUID) ID also lands here, so guide the user to re-check it.
        return { error: { message: "Could not verify the Invite ID. Please paste the exact Link ID from your owner's Settings page and try again." } };
      }
      if (!owner) {
        return { error: { message: "Invalid Invite ID. Please confirm the exact Link ID from your business owner's Settings page." } };
      }
      if (owner.role === 'staff') {
        return { error: { message: "This Invite ID belongs to a staff member, not a business owner. Ask your owner for their Link ID." } };
      }
    }

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
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const res = await supabase.auth.updateUser({ password: newPassword });
        if (!res.error) return res;
      }
      
      if (currentUser?.email) {
        const { data, error } = await supabase.auth.signUp({ 
          email: currentUser.email, 
          password: newPassword,
          options: {
            data: {
              full_name: currentUser.name,
              company_name: currentUser.companyName,
              role: currentUser.role
            }
          }
        });

        if (error && (error.message.includes("already registered") || error.message.includes("already exist") || error.message.includes("User already registered"))) {
          const updateRes = await supabase.auth.updateUser({ password: newPassword });
          return updateRes;
        } else if (!error) {
          return { data };
        }
      }
      
      return await supabase.auth.updateUser({ password: newPassword });
    } catch (err: any) {
      console.error("updatePassword error:", err);
      return { error: err };
    }
  }, [currentUser]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('stockbit_firebase_email');
      const { logoutFirebase } = await import('./firebase');
      await logoutFirebase();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setCurrentUser(null);
      setProducts([]);
      setSales([]);
      setSuppliers([]);
      setNotifications([]);
      setUsers([]);
      localStorage.removeItem('stockbit_firebase_email');
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
      
      // Local fallback for immediate persistence and offline use
      localStorage.setItem('stockbit_settings_v1', JSON.stringify(newSettings));
      
      if (currentUser) {
        const targetId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
        if (targetId) {
          // Sync to the user's specific schema seen in screenshots
          // We only sync columns that are confirmed to exist to avoid PGRST errors
          supabase.from('settings').upsert({ 
            user_id: targetId,
            company_name: newSettings.companyName,
            currency: newSettings.currency,
            categories: newSettings.categories,
            low_stock_email_alerts: newSettings.lowStockEmailAlerts,
            notification_email: newSettings.notificationEmail
          }).then(({ error }) => {
            if (error) {
              console.warn("Settings sync skipped (checking schema compatibility):", error.message);
            }
          });

          // Sync with Firestore settings collection
          setDoc(doc(db, "settings", targetId), {
            user_id: targetId,
            company_name: newSettings.companyName,
            currency: newSettings.currency,
            categories: newSettings.categories,
            low_stock_email_alerts: newSettings.lowStockEmailAlerts,
            notification_email: newSettings.notificationEmail,
            tax_rate: newSettings.taxRate,
            theme: newSettings.theme,
            language: newSettings.language
          }, { merge: true }).catch(err => {
            console.error("Firestore settings sync failed:", err);
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
      try {
        await setDoc(doc(db, "products", data.id), { ...data, user_id: userId });
      } catch (err) {
        console.error("Firestore persistence failed for products:", err);
      }
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (!error && data) {
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      try {
        await setDoc(doc(db, "products", id), data, { merge: true });
      } catch (err) {
        console.error("Firestore update failed for products:", err);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (err) {
        console.error("Firestore delete failed for products:", err);
      }
    }
  };

  const recordSale = async (items: SaleItem[], customerName?: string, location?: string, paymentMethod: PaymentMethod = 'cash') => {
    if (!currentUser) return false;
    const userId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    
    if (!userId) {
      console.error("Critical Failure: No target business owner ID found for transaction.");
      return false;
    }

    if (!items || items.length === 0) {
      console.warn("recordSale called with an empty cart.");
      return false;
    }

    // Guard against overselling: never allow a sale that would drive stock negative.
    for (const item of items) {
      const stock = products.find(prod => prod.id === item.productId);
      if (stock && item.quantity > stock.quantity) {
        setError(`Not enough stock for "${stock.name}". Only ${stock.quantity} left.`);
        return false;
      }
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
      try {
        await setDoc(doc(db, "sales", newSale.id), newSale);
      } catch (err) {
        console.error("Firestore persistence failed for sales:", err);
      }
    }

    // Success - Decrease inventory local state and DB
    for (const item of items) {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        const newQty = Math.max(0, p.quantity - item.quantity);
        // Optimistic UI for products
        setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, quantity: newQty } : prod));
        // Update DB
        await supabase.from('products').update({ quantity: newQty }).eq('id', p.id);
        try {
          await setDoc(doc(db, "products", p.id), { quantity: newQty }, { merge: true });
        } catch (err) {
          console.error("Firestore quantity update failed:", err);
        }
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
      try {
        await setDoc(doc(db, "returns", ret.id), ret);
      } catch (err) {
        console.error("Firestore return persistence failed:", err);
      }
      const p = products.find(prod => prod.id === data.product_id);
      if (p) {
        const newQty = p.quantity + data.quantity;
        setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, quantity: newQty } : prod));
        await supabase.from('products').update({ quantity: newQty }).eq('id', p.id);
        try {
          await setDoc(doc(db, "products", p.id), { quantity: newQty }, { merge: true });
        } catch (err) {
          console.error("Firestore quantity update failed on return:", err);
        }
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
        try {
          await setDoc(doc(db, "products", item.productId), { quantity: item.physicalQty }, { merge: true });
        } catch (err) {
          console.error("Firestore reconcile update failed:", err);
        }
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
      try {
        await setDoc(doc(db, "suppliers", data.id), { ...data, user_id: userId });
      } catch (err) {
        console.error("Firestore supplier sync failed:", err);
      }
    }
  };

  const addStaffMember = async (staffData: any) => {
    if (!currentUser) return;
    // Note: In client-side Supabase, signUp logs out the current user.
    // We recommend using the Invite ID flow instead.
    const { error } = await register({ ...staffData, inviteId: currentUser.id });
    if (error) throw error;
  };

  const removeStaffMember = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // Server-verified activation: called after a Paystack payment. The reference is
  // verified against Paystack (secret key) inside the `verify-payment` Edge Function,
  // which activates the subscription only if the payment is real and correctly priced.
  const verifyAndActivateSubscription = useCallback(async (
    reference: string,
    plan: SubscriptionPlan,
    cycle: 'monthly' | 'annual'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { reference, plan, cycle }
      });

      if (error || !data?.success) {
        const message = data?.error || error?.message || 'We could not verify your payment. Please contact support with your reference.';
        return { success: false, error: message };
      }

      const expiry = data.subscription?.subscriptionExpiry;

      // Reflect immediately for the current user if they own the billed account.
      if (currentUser) {
        const targetUserId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
        if (currentUser.id === targetUserId) {
          setCurrentUser({ ...currentUser, isSubscribed: true, plan, subscriptionExpiry: expiry });
        }
        if (targetUserId) {
          const { data: updatedProfiles } = await supabase
            .from('profiles')
            .select('*')
            .or(`id.eq.${targetUserId},parent_id.eq.${targetUserId}`);
          if (updatedProfiles) setUsers(updatedProfiles.map(mapProfile));
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Subscription verification failed:', err);
      return { success: false, error: err?.message || 'Payment verification failed. Please try again.' };
    }
  }, [currentUser]);

  const activateSubscription = async (plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => {
    if (!currentUser) return;
    const targetUserId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    if (!targetUserId) return;

    const expiry = new Date();
    if (cycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
    else expiry.setFullYear(expiry.getFullYear() + 1);

    const updates = { is_subscribed: true, plan, subscription_expiry: expiry.toISOString() };
    const { error } = await supabase.from('profiles').update(updates).eq('id', targetUserId);
    if (!error) {
      // If the current user updated their own subscription, reflect it immediately
      if (currentUser.id === targetUserId) {
        setCurrentUser({ ...currentUser, isSubscribed: true, plan, subscriptionExpiry: expiry.toISOString() });
      }
      // Reload users to update owner status in the users array
      const { data: updatedProfiles } = await supabase.from('profiles').select('*').or(`id.eq.${targetUserId},parent_id.eq.${targetUserId}`);
      if (updatedProfiles) setUsers(updatedProfiles.map(mapProfile));
    }
  };

  return {
    loading, initialLoadComplete, currentUser, products, sales, returns, suppliers, notifications, users, settings, error, isLoggedIn, isOnline,
    login, register, resetPassword, updatePassword, logout, updateSettings, addProduct, updateProduct, deleteProduct, recordSale, reconcileInventory, recordReturn, addSupplier, addStaffMember, removeStaffMember, activateSubscription, verifyAndActivateSubscription, loginWithGoogle
  };
};
