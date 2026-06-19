import { createContext, useContext, useRef, ReactNode } from 'react';
import { RouteWishlistPicker, RouteWishlistPickerHandle } from './RouteWishlistPicker';
import { RouteData } from '@/shared/wishlist';

interface RouteWishlistPickerCtx {
  openRoutePicker: (route: RouteData, onClose?: () => void) => void;
}

const Ctx = createContext<RouteWishlistPickerCtx>({ openRoutePicker: () => {} });

export function RouteWishlistPickerProvider({ children }: { children: ReactNode }) {
  const ref = useRef<RouteWishlistPickerHandle>(null);
  return (
    <Ctx.Provider value={{ openRoutePicker: (route, onClose) => ref.current?.open(route, onClose) }}>
      {children}
      <RouteWishlistPicker ref={ref} />
    </Ctx.Provider>
  );
}

export function useRouteWishlistPicker() {
  return useContext(Ctx);
}
