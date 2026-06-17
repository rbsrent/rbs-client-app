import { createContext, useContext, useRef, ReactNode } from 'react';
import { WishlistPicker, WishlistPickerHandle } from './WishlistPicker';
import { BoatData } from '@/shared/wishlist';

interface WishlistPickerCtx {
  openPicker: (boat: BoatData, onClose?: () => void) => void;
}

const Ctx = createContext<WishlistPickerCtx>({ openPicker: () => {} });

export function WishlistPickerProvider({ children }: { children: ReactNode }) {
  const ref = useRef<WishlistPickerHandle>(null);
  return (
    <Ctx.Provider value={{ openPicker: (boat, onClose) => ref.current?.open(boat, onClose) }}>
      {children}
      <WishlistPicker ref={ref} />
    </Ctx.Provider>
  );
}

export function useWishlistPicker() {
  return useContext(Ctx);
}
