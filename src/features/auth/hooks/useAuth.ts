import { useState } from 'react';

import { authSupabase } from '@/shared/supabase/authClient';
import { normalizePhone } from '@/shared/utils/phone';
import { useAuthStore } from '@/store/useAuthStore';

type Channel = 'sms' | 'max';

export function useAuth() {
  const { setSession, setSmsUser, setLoading, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const { data } = await authSupabase.rpc('get_sms_client_profile');
      if (data) setSmsUser((Array.isArray(data) ? data[0] : data) ?? null);
    } catch {}
  };

  const sendCode = async (phone: string, channel: Channel) => {
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizePhone(phone).replace(/^8/, '7');
      const fn = channel === 'sms' ? 'send-sms-verification' : 'send-max-verification';
      const { error: fnError } = await authSupabase.functions.invoke(fn, {
        body: { phone: normalized },
      });
      if (fnError) throw fnError;
      return { success: true };
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка отправки кода';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (phone: string, code: string) => {
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizePhone(phone).replace(/^8/, '7');
      const { data, error: fnError } = await authSupabase.functions.invoke('verify-sms-code', {
        body: { phone: normalized, code },
      });
      if (fnError) throw fnError;
      if (!data?.session) throw new Error('Сессия не получена');
      await authSupabase.auth.setSession(data.session);
      setSession(data.session);
      await fetchProfile();
      return { success: true };
    } catch (e: any) {
      const msg = e?.message ?? 'Неверный код';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const createTelegramToken = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await authSupabase.functions.invoke(
        'create-telegram-login-token',
        { body: {} },
      );
      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error ?? 'Не удалось создать ссылку');
      return {
        success: true as const,
        token: data.token as string,
        deepLink: data.deepLink as string,
        webLink: data.webLink as string,
        expiresAt: data.expiresAt as string,
      };
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка Telegram входа';
      setError(msg);
      return { success: false as const, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyTelegramToken = async (token: string) => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await authSupabase.functions.invoke(
        'verify-telegram-login',
        { body: { token } },
      );
      if (fnError) throw fnError;
      if (!data?.success || !data.session) throw new Error(data?.error ?? 'Ошибка верификации');
      await authSupabase.auth.setSession(data.session);
      setSession(data.session);
      await fetchProfile();
      return { success: true };
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка входа через Telegram';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { data: { user } } = await authSupabase.auth.getUser();
      if (user) {
        await authSupabase.from('push_tokens').delete().eq('user_id', user.id);
      }
    } catch {}
    await authSupabase.auth.signOut();
    setSession(null);
    setSmsUser(null);
  };

  return {
    sendCode,
    verifyCode,
    createTelegramToken,
    verifyTelegramToken,
    fetchProfile,
    signOut,
    isLoading,
    error,
    setError,
  };
}
