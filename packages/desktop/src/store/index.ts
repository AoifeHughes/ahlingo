import { configureStore } from '@reduxjs/toolkit';
import { userSettingsSlice } from './slices/userSettingsSlice';
import { exerciseSlice } from './slices/exerciseSlice';
import { gameSlice } from './slices/gameSlice';
import { uiSlice } from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    userSettings: userSettingsSlice.reducer,
    exercise: exerciseSlice.reducer,
    game: gameSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;