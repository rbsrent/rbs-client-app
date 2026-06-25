import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

export interface WishlistToastPayload {
  type: 'saved' | 'deleted';
  listName: string;
  imageUrl?: string | null;
  onEdit?: () => void;
}

interface WishlistToastCtx {
  payload: WishlistToastPayload | null;
  show: (p: WishlistToastPayload) => void;
  dismiss: () => void;
}

const Ctx = createContext<WishlistToastCtx>({
  payload: null,
  show: () => {},
  dismiss: () => {},
});

export function WishlistToastProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<WishlistToastPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => setPayload(null), []);

  const show = useCallback((p: WishlistToastPayload) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPayload(p);
    timerRef.current = setTimeout(() => setPayload(null), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ payload, show, dismiss }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWishlistToast() {
  return useContext(Ctx);
}
