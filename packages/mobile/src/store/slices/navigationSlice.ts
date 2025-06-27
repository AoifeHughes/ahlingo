import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ScreenName, NavigationParams} from '@ahlingo/core';

interface NavigationState {
  currentScreen: ScreenName;
  previousScreen: ScreenName | null;
  navigationHistory: ScreenName[];
  screenParams: Partial<NavigationParams>;
}

const initialState: NavigationState = {
  currentScreen: 'MainMenu',
  previousScreen: null,
  navigationHistory: ['MainMenu'],
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
        params?: Partial<NavigationParams[ScreenName]>;
      }>
    ) => {
      const {screen, params} = action.payload;
      
      state.previousScreen = state.currentScreen;
      state.currentScreen = screen;
      state.navigationHistory.push(screen);
      
      // Keep history limited to prevent memory issues
      if (state.navigationHistory.length > 10) {
        state.navigationHistory.shift();
      }
      
      if (params) {
        state.screenParams = {
          ...state.screenParams,
          [screen]: params,
        };
      }
    },
    
    goBack: (state) => {
      if (state.navigationHistory.length > 1) {
        // Remove current screen from history
        state.navigationHistory.pop();
        
        // Get previous screen
        const previousScreen = state.navigationHistory[state.navigationHistory.length - 1];
        
        state.previousScreen = state.currentScreen;
        state.currentScreen = previousScreen as ScreenName;
      } else {
        // Fallback to main menu if no history
        state.previousScreen = state.currentScreen;
        state.currentScreen = 'MainMenu';
      }
    },
    
    resetNavigation: (state) => {
      state.currentScreen = 'MainMenu';
      state.previousScreen = null;
      state.navigationHistory = ['MainMenu'];
      state.screenParams = {};
    },
    
    setScreenParams: (
      state,
      action: PayloadAction<{
        screen: ScreenName;
        params: Partial<NavigationParams[ScreenName]>;
      }>
    ) => {
      const {screen, params} = action.payload;
      state.screenParams = {
        ...state.screenParams,
        [screen]: params,
      };
    },
    
    clearScreenParams: (state, action: PayloadAction<ScreenName>) => {
      const screen = action.payload;
      if (state.screenParams[screen]) {
        delete state.screenParams[screen];
      }
    },
  },
});

export const {
  navigateToScreen,
  goBack,
  resetNavigation,
  setScreenParams,
  clearScreenParams,
} = navigationSlice.actions;

export {navigationSlice};