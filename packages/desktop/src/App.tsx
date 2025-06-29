import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { store } from './store';
import { AppLayout } from './components/AppLayout';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TopicSelectionScreen } from './screens/TopicSelectionScreen';
import { PairsGameScreen } from './screens/PairsGameScreen';
import { ConversationExercisesScreen } from './screens/ConversationExercisesScreen';
import { TranslationExercisesScreen } from './screens/TranslationExercisesScreen';
import { ChatbotScreen } from './screens/ChatbotScreen';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
      dark: '#1976D2',
    },
    secondary: {
      main: '#FFC107',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App(): JSX.Element {
  useEffect(() => {
    // Handle Electron menu events
    const handleMenuEvents = () => {
      if (window.electronAPI) {
        window.electronAPI.onMenuNewGame(() => {
          console.log('New game triggered from menu');
          // Navigate to topic selection or reset current game
        });

        window.electronAPI.onMenuAbout(() => {
          console.log('About triggered from menu');
          // Show about dialog
        });
      }
    };

    handleMenuEvents();

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden' 
          }}>
            <AppLayout>
              <Routes>
                <Route path="/" element={<MainMenuScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/topics" element={<TopicSelectionScreen />} />
                <Route path="/pairs-game/:topicId?" element={<PairsGameScreen />} />
                <Route path="/conversation/:topicId?" element={<ConversationExercisesScreen />} />
                <Route path="/translation/:topicId?" element={<TranslationExercisesScreen />} />
                <Route path="/chatbot" element={<ChatbotScreen />} />
              </Routes>
            </AppLayout>
          </Box>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;