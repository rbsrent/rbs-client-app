import { create } from 'zustand';

interface BookingDraft {
  boatId: string | null;
  boatName: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  pierId: string | null;
  pierName: string | null;
  pierAddress: string | null;
  guestCount: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  promoCode: string;
  promoCodeId: string | null;
  giftCertCode: string;
  giftCertId: string | null;
  giftCertAmount: number;
  totalPublicPrice: number;
  prepaymentAmount: number;
  remainingAmount: number;
  discountAmount: number;
  originalPrice: number;
  idempotencyKey: string | null;
}

interface BookingState {
  draft: BookingDraft;
  step: number;
  setDraft: (fields: Partial<BookingDraft>) => void;
  setStep: (step: number) => void;
  resetDraft: () => void;
}

const defaultDraft: BookingDraft = {
  boatId: null,
  boatName: null,
  date: null,
  startTime: null,
  endTime: null,
  pierId: null,
  pierName: null,
  pierAddress: null,
  guestCount: 1,
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  promoCode: '',
  promoCodeId: null,
  giftCertCode: '',
  giftCertId: null,
  giftCertAmount: 0,
  totalPublicPrice: 0,
  prepaymentAmount: 0,
  remainingAmount: 0,
  discountAmount: 0,
  originalPrice: 0,
  idempotencyKey: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  draft: defaultDraft,
  step: 0,

  setDraft: (fields) => set((s) => ({ draft: { ...s.draft, ...fields } })),
  setStep: (step) => set({ step }),
  resetDraft: () => set({ draft: defaultDraft, step: 0 }),
}));
