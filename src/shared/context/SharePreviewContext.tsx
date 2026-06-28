import { createContext, ReactNode, useCallback, useContext, useState } from "react";

export type SharePreviewTarget =
  | { type: "boat"; id: string }
  | { type: "route"; slug: string };

interface SharePreviewCtx {
  target: SharePreviewTarget | null;
  show: (t: SharePreviewTarget) => void;
  hide: () => void;
}

const Ctx = createContext<SharePreviewCtx>({
  target: null,
  show: () => {},
  hide: () => {},
});

export function SharePreviewProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<SharePreviewTarget | null>(null);
  const show = useCallback((t: SharePreviewTarget) => setTarget(t), []);
  const hide = useCallback(() => setTarget(null), []);
  return <Ctx.Provider value={{ target, show, hide }}>{children}</Ctx.Provider>;
}

export function useSharePreview() {
  return useContext(Ctx);
}
