import { createContext, ReactNode, useCallback, useContext, useState } from "react";

export interface PromoData {
  title: string;
  body: string;
  imageUrl?: string | null;
  description?: string | null;
  code?: string | null;
  expiresAt?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
}

interface PromoCtx {
  data: PromoData | null;
  show: (d: PromoData) => void;
  hide: () => void;
}

const Ctx = createContext<PromoCtx>({
  data: null,
  show: () => {},
  hide: () => {},
});

export function PromoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PromoData | null>(null);
  const show = useCallback((d: PromoData) => setData(d), []);
  const hide = useCallback(() => setData(null), []);
  return <Ctx.Provider value={{ data, show, hide }}>{children}</Ctx.Provider>;
}

export function usePromo() {
  return useContext(Ctx);
}
