// ─── Shared Booking Types ─────────────────────────────────────────────────────

export interface AppliedDiscount {
  name: string;
  percentage: number;
  description?: string;
  timeConditions?: {
    startHour?: number;
    endHour?: number;
    daysOfWeek?: number[];
  };
}

export interface PricingResult {
  publicPrice: number;
  prepaymentAmount: number;
  remainingAmount: number;
  durationHours: number;
  originalHourlyRate?: number;
  finalHourlyRate?: number;
  appliedDiscount?: AppliedDiscount | null;
  totalSavings?: number;
}

export interface Pier {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Boat {
  id: string;
  name: string;
  type: string | null;
  capacity: number | null;
  length_meters: number | null;
  price_per_hour: number;
  cover_image_url: string | null;
  min_duration_hours: number | null;
}
