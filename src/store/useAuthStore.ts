import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { authSupabase } from '@/shared/supabase/authClient';

interface SmsUser {
  id: string;
  phone_number: string;
  full_name: string | null;
  email: string | null;
  telegram_username: string | null;
  preferred_promo_code: string | null;
  preferred_promo_description: string | null;
  preferred_promo_discount_type: string | null;
  preferred_promo_discount_value: number | null;
}

interface AuthState {
  session: Session | null;
  smsUser: SmsUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  setSession: (session: Session | null) => void;
  setSmsUser: (user: SmsUser | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  smsUser: null,
  isLoading: false,
  isHydrated: false,

  setSession: (session) => set({ session }),
  setSmsUser: (smsUser) => set({ smsUser }),
  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    await authSupabase.auth.signOut();
    set({ session: null, smsUser: null });
  },

  fetchProfile: async () => {
    try {
      const { data, error } = await authSupabase.rpc('get_sms_client_profile');
      if (!error && data) set({ smsUser: data });
    } catch {}
  },

  hydrate: async () => {
    const { data } = await authSupabase.auth.getSession();
    set({ session: data.session, isHydrated: true });
    if (data.session) {
      try {
        const { data: profile, error } = await authSupabase.rpc('get_sms_client_profile');
        if (!error && profile) set({ smsUser: profile });
      } catch {}
    }
  },
}));
