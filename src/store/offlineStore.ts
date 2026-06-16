import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, configureStore, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

interface CachedBoat {
  id: string;
  name: string;
  type: string;
  price_per_hour: number;
  capacity: number;
  pier_name: string | null;
  cover_image_url: string | null;
}

interface OfflineState {
  cachedBoats: CachedBoat[];
  cachedAt: number | null;
  pendingPaymentBookingId: string | null;
  pendingPaymentId: string | null;
}

const offlineSlice = createSlice({
  name: 'offline',
  initialState: {
    cachedBoats: [],
    cachedAt: null,
    pendingPaymentBookingId: null,
    pendingPaymentId: null,
  } as OfflineState,
  reducers: {
    setCachedBoats(state, action: PayloadAction<CachedBoat[]>) {
      state.cachedBoats = action.payload;
      state.cachedAt = Date.now();
    },
    setPendingPayment(state, action: PayloadAction<{ bookingId: string; paymentId: string } | null>) {
      state.pendingPaymentBookingId = action.payload?.bookingId ?? null;
      state.pendingPaymentId = action.payload?.paymentId ?? null;
    },
    clearPendingPayment(state) {
      state.pendingPaymentBookingId = null;
      state.pendingPaymentId = null;
    },
  },
});

export const { setCachedBoats, setPendingPayment, clearPendingPayment } = offlineSlice.actions;

const persistConfig = {
  key: 'rbs-offline',
  storage: AsyncStorage,
  whitelist: ['cachedBoats', 'cachedAt', 'pendingPaymentBookingId', 'pendingPaymentId'],
};

const persistedReducer = persistReducer(persistConfig, offlineSlice.reducer);

export const offlineReduxStore = configureStore({
  reducer: { offline: persistedReducer },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(offlineReduxStore);

export type OfflineRootState = ReturnType<typeof offlineReduxStore.getState>;
export type OfflineDispatch = typeof offlineReduxStore.dispatch;
