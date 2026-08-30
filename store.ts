import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Product, Sale, Supplier, User, Settings, AppNotification, SaleItem, SubscriptionPlan, StocktakeItem, ProductReturn, PaymentMethod, StaffInvite } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { getEntitlements, isUnlimited } from './constants/plans';

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

// 2-month (60-day) free trial, matching the advertised plan.
export const TRIAL_DAYS = 60;

export const getTrialStatus = (user: User | null) => {
  const expiredResult = { isSubscribed: false, daysLeft: 0, isExpired: true };

  if (!user) return { isSubscribed: false, daysLeft: 0, isExpired: false };
  if (user.isSubscribed) {
    // A paid plan that has lapsed is treated as expired server-side too.
    if (user.subscriptionExpiry && new Date(user.subscriptionExpiry).getTime() < Date.now()) return expiredResult;
    return { isSubscribed: true, daysLeft: 0, isExpired: false };
  }

  const start = new Date(user.trialStartDate);
  const now = new Date();

  if (isNaN(start.getTime())) return expiredResult;

  const diff = now.getTime() - start.getTime();
  const daysUsed = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (daysUsed >= TRIAL_DAYS) return expiredResult;

  const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed);
  if (daysLeft <= 0) return expiredResult;

  return { isSubscribed: false, daysLeft, isExpired: false };
};

/**
 * Resolves the trial/subscription status that actually governs a user's access.
 * Staff inherit their business owner's status — a staff member's own signup date
 * must never grant a fresh trial when the owner's trial has ended.
 */
export const getEffectiveTrialStatus = (currentUser: User | null, users: User[]) => {
  if (currentUser?.role === 'staff' && currentUser.parentId) {
    const owner = users.find(u => u.id === currentUser.parentId);
    if (owner) return getTrialStatus(owner);
    return { isSubscribed: false, daysLeft: 0, isExpired: true };
  }
  return getTrialStatus(currentUser);
};

export const useStore = () => {
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authProviders, setAuthProviders] = useState<string[]>([]);
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);
  const [pendingInviteError, setPendingInviteError] = useState<string | null>(null);
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
    paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    marketplaces: { jumia: false, konga: false, whatsapp: false }
  });
  const [error, setError] = useState<string | null>(null);
  const lastLoadedUser = useRef<string | null>(null);
  const isDataLoading = useRef(false);
  const hydratingUser = useRef<string | null>(null);

  const isLoggedIn = !!currentUser;

  const loadData = useCallback(async (userId: string, isStaff: boolean, parentId?: string) => {
    if (!userId || isDataLoading.current) return;
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
        supabase.from('settings').select('*').eq('user_id', targetUserId).maybeSingle(),
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
          } catch (e) {
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
  }, []);

  /**
   * Turns a Supabase session into an application user. Creates the profile row
   * from the signup metadata when it does not exist yet (first login after
   * email verification, or first Google sign-in). The database trigger
   * `guard_profile_insert` validates everything the client sends here.
   */
  const hydrateFromSession = useCallback(async (session: Session) => {
    const authUser = session.user;
    // Supabase fires getSession + INITIAL_SESSION + SIGNED_IN for the same login; hydrate once.
    if (hydratingUser.current === authUser.id) return;
    hydratingUser.current = authUser.id;
    setAuthProviders(((authUser.app_metadata?.providers as string[]) || [authUser.app_metadata?.provider || 'email']).filter(Boolean));

    try {
      let { data, error: profileError } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();

      const metadata = authUser.user_metadata || {};
      if (!data && (!profileError || profileError.code === 'PGRST116')) {
        const displayName = metadata.full_name || metadata.name || (authUser.email || '').split('@')[0];
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          name: displayName,
          company_name: metadata.invite_code ? '' : (metadata.company_name || `${displayName} Shop`),
          // Role/linkage are decided server-side (guard_profile_insert + accept_staff_invite).
          role: 'user',
          parent_id: null,
          trial_start_date: new Date().toISOString()
        };
        const created = await supabase.from('profiles').insert([newProfile]).select().single();
        data = created.data;
        profileError = created.error;
      }

      // First login after a "Join as staff" sign-up: redeem the invite code server-side.
      if (data && typeof metadata.invite_code === 'string' && metadata.invite_code && data.role !== 'staff') {
        const { data: linked, error: acceptError } = await supabase.rpc('accept_staff_invite', { p_code: metadata.invite_code });
        if (!acceptError && linked) {
          data = linked;
        } else {
          setPendingInviteError(acceptError?.message?.replace(/^.*?:\s*/, '') || 'Your invite could not be applied.');
        }
        // Never retry a consumed/invalid code on the next login.
        supabase.auth.updateUser({ data: { invite_code: null } }).catch(() => {});
      }

      if (!data) {
        console.error("Profile could not be loaded/created", profileError);
        hydratingUser.current = null;
        setLoading(false);
        setInitialLoadComplete(true);
        return;
      }

      const user = mapProfile(data);
      if (user.role === 'staff' && user.parentId) {
        const { data: parentData } = await supabase.from('profiles').select('company_name').eq('id', user.parentId).maybeSingle();
        if (parentData) user.companyName = parentData.company_name;
      }

      setCurrentUser(user);
      loadData(user.id, user.role === 'staff', user.parentId);
    } catch (err) {
      console.error("Session hydration failed", err);
      hydratingUser.current = null;
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [loadData]);

  // Realtime: keep products, sales and the team roster live for this business.
  useEffect(() => {
    if (!currentUser) return;
    const targetUserId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    if (!targetUserId) return;

    const channel = supabase
      .channel(`business-${targetUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${targetUserId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => prev.some(p => p.id === payload.new.id) ? prev : [...prev, payload.new as Product]);
        }
        if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        }
        if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales', filter: `user_id=eq.${targetUserId}` }, (payload) => {
        setSales(prev => prev.some(s => s.id === payload.new.id) ? prev : [payload.new as Sale, ...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `parent_id=eq.${targetUserId}` }, async () => {
        const { data } = await supabase.from('profiles').select('*').or(`id.eq.${targetUserId},parent_id.eq.${targetUserId}`);
        if (data) setUsers(data.map(mapProfile));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Legacy marker from the removed Firebase flow — scrub it.
    localStorage.removeItem('stockbit_firebase_email');

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn("Session retrieval error:", error.message);
        if (error.message.includes('Refresh Token') || error.message.includes('invalid_grant')) {
          supabase.auth.signOut();
        }
        setLoading(false);
        setInitialLoadComplete(true);
        return;
      }
      if (session?.user) {
        hydrateFromSession(session);
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
        hydratingUser.current = null;
        lastLoadedUser.current = null;
        setCurrentUser(null);
        setAuthProviders([]);
        setProducts([]);
        setSales([]);
        setReturns([]);
        setSuppliers([]);
        setNotifications([]);
        setUsers([]);
        setInitialLoadComplete(true);
        setLoading(false);
        return;
      }
      if (event === 'TOKEN_REFRESHED') return;
      if (session?.user) {
        hydrateFromSession(session);
      } else if (event === 'INITIAL_SESSION') {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUsers = useCallback(async () => {
    if (!currentUser) return;
    const targetUserId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
    if (!targetUserId) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${targetUserId},parent_id.eq.${targetUserId}`);
    if (data) setUsers(data.map(mapProfile));
  }, [currentUser]);

  const login = useCallback(async (email: string, pass: string) => {
    return await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
  }, []);

  /**
   * Google sign-in via Supabase's own OAuth (PKCE redirect). The browser is
   * navigated to Google and back; onAuthStateChange hydrates the profile.
   */
  const loginWithGoogle = useCallback(async (): Promise<{ redirecting?: boolean }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } }
    });
    if (error) throw error;
    return { redirecting: true };
  }, []);

  const previewInvite = useCallback(async (code: string): Promise<{ valid: boolean; companyName?: string; reason?: string }> => {
    const { data, error } = await supabase.rpc('preview_staff_invite', { p_code: code.trim().toUpperCase() });
    if (error) return { valid: false, reason: 'Could not check this code right now. Please try again.' };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { valid: false, reason: 'Invite code not found.' };
    return { valid: !!row.valid, companyName: row.company_name || undefined, reason: row.reason || undefined };
  }, []);

  const register = useCallback(async ({ email, password, name, companyName, inviteCode }: {
    email: string; password: string; name: string; companyName?: string; inviteCode?: string | null;
  }) => {
    const code = inviteCode ? inviteCode.trim().toUpperCase() : null;
    if (code) {
      const preview = await previewInvite(code);
      if (!preview.valid) {
        return { error: { message: preview.reason || 'This invite code is not valid.' } };
      }
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name.trim(),
          company_name: code ? '' : (companyName || '').trim(),
          invite_code: code
        }
      }
    });

    if (authError) return { error: authError };
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: { message: "If this email is new, a verification link has been sent. If you already have an account, please sign in instead." } };
    }
    return { data };
  }, [previewInvite]);

  /** Sets/changes the password for the signed-in user and signs out every OTHER device. */
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const res = await supabase.auth.updateUser({ password: newPassword });
      if (res.error) return res;
      try { await supabase.auth.signOut({ scope: 'others' }); } catch { /* best effort */ }
      return res;
    } catch (err: any) {
      console.error("updatePassword error:", err);
      return { error: err };
    }
  }, []);

  /** Re-verifies the current password (used by the idle lock screen). */
  const reauthenticate = useCallback(async (password: string) => {
    if (!currentUser?.email) return { error: { message: 'No signed-in user.' } };
    return await supabase.auth.signInWithPassword({ email: currentUser.email, password });
  }, [currentUser?.email]);

  const signOutEverywhere = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'global' });
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      hydratingUser.current = null;
      lastLoadedUser.current = null;
      setCurrentUser(null);
      setAuthProviders([]);
      setProducts([]);
      setSales([]);
      setReturns([]);
      setSuppliers([]);
      setNotifications([]);
      setUsers([]);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/#update_password`
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem('stockbit_settings_v1', JSON.stringify(newSettings));

      if (currentUser) {
        const targetId = currentUser.role === 'staff' ? currentUser.parentId : currentUser.id;
        if (targetId) {
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
      setProducts(prev => prev.some(p => p.id === data.id) ? prev : [...prev, data]);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    // user_id is tenancy-critical and never editable from the client.
    const { user_id: _ignored, ...safeUpdates } = updates as any;
    const { data, error } = await supabase.from('products').update(safeUpdates).eq('id', id).select().single();
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
      console.error("No target business owner ID found for transaction.");
      return false;
    }
    if (!items || items.length === 0) return false;

    // Client-side pre-check for a friendly error; the server re-checks atomically.
    for (const item of items) {
      const stock = products.find(prod => prod.id === item.productId);
      if (stock && item.quantity > stock.quantity) {
        setError(`Not enough stock for "${stock.name}". Only ${stock.quantity} left.`);
        return false;
      }
    }

    // Preferred: atomic server-side RPC (locks rows, recomputes totals from DB prices).
    const rpc = await supabase.rpc('record_sale', {
      p_items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      p_customer_name: customerName || 'Walk-in',
      p_location: location || 'Main Terminal',
      p_payment_method: paymentMethod
    });

    let newSale: Sale | null = null;
    if (!rpc.error && rpc.data) {
      newSale = rpc.data as Sale;
    } else if (rpc.error && (rpc.error.code === 'PGRST202' || rpc.error.code === '42883')) {
      // RPC not installed yet (supabase/sql/security.sql not applied) — legacy path.
      const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const totalCost = items.reduce((sum, i) => sum + ((i.costPrice || 0) * i.quantity), 0);
      const taxAmount = totalPrice * (settings.taxRate / 100);
      const { data, error: insertError } = await supabase.from('sales').insert([{
        user_id: userId, items, total_price: totalPrice + taxAmount, total_cost: totalCost, tax_amount: taxAmount,
        customer_name: customerName || 'Walk-in', location: location || 'Main Terminal', payment_method: paymentMethod,
        is_checked: true, is_archived: false, date: new Date().toISOString()
      }]).select().single();
      if (insertError) {
        console.error("Sale Insert Error:", insertError.message);
        return false;
      }
      newSale = data;
      for (const item of items) {
        const p = products.find(prod => prod.id === item.productId);
        if (p) await supabase.from('products').update({ quantity: Math.max(0, p.quantity - item.quantity) }).eq('id', p.id);
      }
    } else {
      console.error("Sale failed:", rpc.error?.message);
      setError(rpc.error?.message?.replace(/^.*?:\s*/, '') || 'Sale could not be recorded.');
      return false;
    }

    if (newSale) {
      const sale = newSale;
      setSales(prev => prev.some(s => s.id === sale.id) ? prev : [sale, ...prev]);
    }

    // Optimistic local stock update (realtime will reconcile).
    setProducts(prev => prev.map(prod => {
      const sold = items.find(i => i.productId === prod.id);
      return sold ? { ...prod, quantity: Math.max(0, prod.quantity - sold.quantity) } : prod;
    }));
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
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, quantity: item.physicalQty } : p));
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

  // ---------------- Staff invitations ----------------
  const loadStaffInvites = useCallback(async () => {
    if (!currentUser || currentUser.role === 'staff') return;
    const { data } = await supabase
      .from('staff_invites')
      .select('*')
      .eq('owner_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (data) setStaffInvites(data as StaffInvite[]);
  }, [currentUser]);

  const createStaffInvite = useCallback(async (email?: string): Promise<StaffInvite> => {
    const { data, error } = await supabase.rpc('create_staff_invite', { p_email: email?.trim() || null });
    if (error) throw new Error(error.message.replace(/^.*?:\s*/, ''));
    const invite = data as StaffInvite;
    setStaffInvites(prev => [invite, ...prev.map(i => (i.status === 'pending' && invite.email && i.email === invite.email) ? { ...i, status: 'revoked' as const } : i)]);
    return invite;
  }, []);

  const revokeStaffInvite = useCallback(async (id: string) => {
    const { error } = await supabase.from('staff_invites').update({ status: 'revoked' }).eq('id', id);
    if (error) throw new Error(error.message);
    setStaffInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'revoked' } : i));
  }, []);

  /** A signed-in account with no shop of its own redeems a code and becomes staff. */
  const joinBusinessWithCode = useCallback(async (code: string) => {
    const { data, error } = await supabase.rpc('accept_staff_invite', { p_code: code.trim().toUpperCase() });
    if (error) throw new Error(error.message.replace(/^.*?:\s*/, ''));
    const user = mapProfile(data);
    if (user.parentId) {
      const { data: parentData } = await supabase.from('profiles').select('company_name').eq('id', user.parentId).maybeSingle();
      if (parentData) user.companyName = parentData.company_name;
    }
    lastLoadedUser.current = null;
    setCurrentUser(user);
    await loadData(user.id, true, user.parentId);
  }, [loadData]);

  const clearPendingInviteError = useCallback(() => setPendingInviteError(null), []);

  /**
   * Detaches a staff member from this business. The row is kept (so the person
   * cannot silently re-join by re-creating a profile from stale signup metadata)
   * but no longer points at the owner, so RLS immediately cuts their access.
   */
  const removeStaffMember = async (id: string) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({ parent_id: null, role: 'user' })
      .eq('id', id)
      .eq('parent_id', currentUser.id);
    if (error) throw new Error(error.message);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Server-verified activation: the `verify-payment` Edge Function checks the
  // Paystack reference with the secret key and updates billing with the service role.
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

  const clearError = useCallback(() => setError(null), []);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const clearNotifications = useCallback(async () => {
    if (!currentUser) return;
    setNotifications([]);
    await supabase.from('notifications').delete().eq('user_id', currentUser.id);
  }, [currentUser]);

  return {
    loading, initialLoadComplete, currentUser, authProviders, products, sales, returns, suppliers, notifications, users, settings, error, isLoggedIn, isOnline,
    staffInvites, pendingInviteError, clearPendingInviteError,
    login, loginWithGoogle, register, previewInvite, resetPassword, updatePassword, reauthenticate, signOutEverywhere, logout, updateSettings,
    addProduct, updateProduct, deleteProduct, recordSale, reconcileInventory, recordReturn, addSupplier, removeStaffMember,
    loadStaffInvites, createStaffInvite, revokeStaffInvite, joinBusinessWithCode,
    verifyAndActivateSubscription, refreshUsers, clearError, markNotificationRead, clearNotifications
  };
};
