import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  currentRoute: string;
  isFullscreen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: number;
  }>;
  dialogs: {
    about: boolean;
    settings: boolean;
    gameCompletion: boolean;
  };
  loading: {
    global: boolean;
    screen: boolean;
  };
}

const initialState: UiState = {
  sidebarOpen: true,
  currentRoute: '/',
  isFullscreen: false,
  theme: 'light',
  notifications: [],
  dialogs: {
    about: false,
    settings: false,
    gameCompletion: false,
  },
  loading: {
    global: false,
    screen: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    setCurrentRoute: (state, action: PayloadAction<string>) => {
      state.currentRoute = action.payload;
    },
    
    toggleFullscreen: (state) => {
      state.isFullscreen = !state.isFullscreen;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
    }>) => {
      const notification = {
        id: Math.random().toString(36).substr(2, 9),
        ...action.payload,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
      
      // Keep only the last 5 notifications
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    openDialog: (state, action: PayloadAction<keyof UiState['dialogs']>) => {
      state.dialogs[action.payload] = true;
    },
    
    closeDialog: (state, action: PayloadAction<keyof UiState['dialogs']>) => {
      state.dialogs[action.payload] = false;
    },
    
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    setScreenLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.screen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setCurrentRoute,
  toggleFullscreen,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  openDialog,
  closeDialog,
  setGlobalLoading,
  setScreenLoading,
} = uiSlice.actions;

export { uiSlice };