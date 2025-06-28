import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScreenName, NavigationParams } from '@ahlingo/core';

interface NavigationState {
  currentScreen: ScreenName;
  screenHistory: ScreenName[];
  screenParams: Partial<NavigationParams>;
}

const initialState: NavigationState = {
  currentScreen: 'MainMenu',
  screenHistory: ['MainMenu'],
  screenParams: {},
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    navigateToScreen: (
      state,
      action: PayloadAction<{
        screen: ScreenName;
        params?: NavigationParams[ScreenName];
      }>
    ) => {
      const { screen, params } = action.payload;
      state.currentScreen = screen;
      state.screenHistory.push(screen);
      
      if (params) {
        state.screenParams[screen] = params;
      }
      
      // Keep history to reasonable size
      if (state.screenHistory.length > 10) {
        state.screenHistory = state.screenHistory.slice(-10);
      }
    },
    
    goBack: (state) => {
      if (state.screenHistory.length > 1) {
        state.screenHistory.pop();
        state.currentScreen = state.screenHistory[state.screenHistory.length - 1];
      }
    },
    
    resetNavigation: (state) => {
      state.currentScreen = 'MainMenu';
      state.screenHistory = ['MainMenu'];
      state.screenParams = {};
    },
    
    setScreenParams: (
      state,
      action: PayloadAction<{
        screen: ScreenName;
        params: NavigationParams[ScreenName];
      }>
    ) => {
      const { screen, params } = action.payload;
      state.screenParams[screen] = params;
    },
  },
});

export const {
  navigateToScreen,
  goBack,
  resetNavigation,
  setScreenParams,
} = navigationSlice.actions;

export { navigationSlice };