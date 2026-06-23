import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { publicSupabase } from "@/shared/supabase/publicClient";

const STORAGE_KEY = "@rbs:pending_payment";
const URL_TTL_MS = 60 * 60 * 1000; // 1 hour — YooKassa URL expiry

export interface PendingPaymentData {
  bookingId: string;
  confirmationUrl: string;
  amount: number;
  savedAt: number;
}

interface PendingPaymentCtx {
  pending: PendingPaymentData | null;
  save: (data: Omit<PendingPaymentData, "savedAt">) => Promise<void>;
  clear: () => Promise<void>;
}

const Ctx = createContext<PendingPaymentCtx>({
  pending: null,
  save: async () => {},
  clear: async () => {},
});

export function PendingPaymentProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingPaymentData | null>(null);

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setPending(null);
  }, []);

  // Verify booking status from Supabase, clear if no longer pending
  const verify = useCallback(
    async (data: PendingPaymentData) => {
      const { data: row } = await publicSupabase
        .from("public_bookings")
        .select("booking_status")
        .eq("id", data.bookingId)
        .single();
      const status = (row as any)?.booking_status;
      if (status === "confirmed" || status === "paid" || status === "cancelled") {
        await clear();
      }
    },
    [clear],
  );

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data: PendingPaymentData = JSON.parse(raw);
        // Drop expired URLs
        if (Date.now() - data.savedAt > URL_TTL_MS) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }
        setPending(data);
        // Background verify
        verify(data);
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    })();
  }, [verify]);

  const save = useCallback(
    async (data: Omit<PendingPaymentData, "savedAt">) => {
      const full: PendingPaymentData = { ...data, savedAt: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(full));
      setPending(full);
    },
    [],
  );

  return (
    <Ctx.Provider value={{ pending, save, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePendingPayment() {
  return useContext(Ctx);
}
