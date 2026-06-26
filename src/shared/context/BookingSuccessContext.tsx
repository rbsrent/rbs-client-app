import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { BookingSuccessData } from "@/features/booking/components/BookingSuccessModal";

interface BookingSuccessCtx {
  data: BookingSuccessData | null;
  show: (d: BookingSuccessData) => void;
  hide: () => void;
}

const Ctx = createContext<BookingSuccessCtx>({
  data: null,
  show: () => {},
  hide: () => {},
});

export function BookingSuccessProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BookingSuccessData | null>(null);
  const show = useCallback((d: BookingSuccessData) => setData(d), []);
  const hide = useCallback(() => setData(null), []);
  return <Ctx.Provider value={{ data, show, hide }}>{children}</Ctx.Provider>;
}

export function useBookingSuccess() {
  return useContext(Ctx);
}
