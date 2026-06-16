import {
  Anchor,
  Calendar,
  CreditCard,
  Gift,
  Sailboat,
} from 'lucide-react-native';

import { Slide } from '../data/slides';

export function SlideIcon({ icon, color }: { icon: Slide['icon']; color: string }) {
  const p = { size: 80, color, strokeWidth: 1.5 };
  switch (icon) {
    case 'sailboat':    return <Sailboat {...p} />;
    case 'anchor':      return <Anchor {...p} />;
    case 'calendar':    return <Calendar {...p} />;
    case 'credit-card': return <CreditCard {...p} />;
    case 'gift':        return <Gift {...p} />;
  }
}
