export interface DateTimeFilter {
  date: Date | null;
  startHour: number;
  durationHours: number;
}

export interface Filters {
  typeId: string;
  capacityMin: number | null;
  priceMin: number | null;
  priceMax: number | null;
  hasTarp: boolean;
  hasToilet: boolean;
  hasHeating: boolean;
  dateTime: DateTimeFilter;
  pierIds: string[];
  pierRadiusKm: number;
}

export const DEFAULT: Filters = {
  typeId: 'all',
  capacityMin: null,
  priceMin: null,
  priceMax: null,
  hasTarp: false,
  hasToilet: false,
  hasHeating: false,
  dateTime: { date: null, startHour: 10, durationHours: 2 },
  pierIds: [],
  pierRadiusKm: 5,
};