import {configureStore} from '@reduxjs/toolkit';
import {userSettingsSlice} from './slices/userSettingsSlice';
import {exerciseSlice} from './slices/exerciseSlice';
import {gameSlice} from './slices/gameSlice';
import {navigationSlice} from './slices/navigationSlice';

export const store = configureStore({
  reducer: {
    userSettings: userSettingsSlice.reducer,
    exercise: exerciseSlice.reducer,
    game: gameSlice.reducer,
    navigation: navigationSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;