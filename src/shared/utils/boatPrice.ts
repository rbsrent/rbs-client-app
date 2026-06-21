import { ActiveDiscount } from '@/features/catalog/hooks/useDiscountsCache';

export interface BoatPriceInfo {
  displayPrice: number;
  originalPrice: number | null;
  discountPct: number | null;
  isNight: boolean;
}

export function getBoatPriceInfo(
  pricePerHour: number,
  publicPricePerHourNight: number | null | undefined,
  discount?: ActiveDiscount | null,
): BoatPriceInfo {
  const h = new Date().getHours();
  const isNight = h >= 20 || h < 6;
  const basePrice = (isNight && publicPricePerHourNight)
    ? publicPricePerHourNight
    : pricePerHour;
  const displayPrice = discount
    ? Math.round(basePrice * (1 - discount.percentage / 100))
    : basePrice;
  const originalPrice = discount ? basePrice : null;
  const discountPct = discount ? discount.percentage : null;
  return { displayPrice, originalPrice, discountPct, isNight };
}

const _FMT = new Intl.NumberFormat('ru-RU');
export const ruFmtPrice = (n: number) => _FMT.format(Math.round(n));
