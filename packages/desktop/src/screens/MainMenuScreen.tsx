import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Container,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Games as GamesIcon,
  Chat as ChatIcon,
  Translate as TranslateIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useNavigate } from 'react-router-dom';
import { loadUserSettings, loadReferenceData } from '../store/slices/userSettingsSlice';
import { loadTopics } from '../store/slices/exerciseSlice';

export function MainMenuScreen(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { settings, isLoading } = useAppSelector((state) => state.userSettings);

  useEffect(() => {
    // Load initial data when the app starts
    dispatch(loadUserSettings());
    dispatch(loadReferenceData());
    dispatch(loadTopics());
  }, [dispatch]);

  const menuCards = [
    {
      title: 'Pairs Game',
      description: 'Match words and phrases to learn vocabulary',
      icon: <GamesIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/topics',
      color: '#2196F3',
    },
    {
      title: 'Conversation Practice',
      description: 'Practice real conversations and dialogues',
      icon: <ChatIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      path: '/conversation',
      color: '#FFC107',
    },
    {
      title: 'Translation Exercises',
      description: 'Translate sentences and improve comprehension',
      icon: <TranslateIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      path: '/translation',
      color: '#4CAF50',
    },
    {
      title: 'AI Language Tutor',
      description: 'Chat with an AI tutor for personalized learning',
      icon: <PsychologyIcon sx={{ fontSize: 48, color: 'error.main' }} />,
      path: '/chatbot',
      color: '#F44336',
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to AHLingo
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your Desktop Language Learning Companion
        </Typography>
        
        {settings && (
          <Box mt={2}>
            <Chip
              label={`Learning ${settings.language.language}`}
              color="primary"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              label={`${settings.difficulty.difficulty_level} Level`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}
        
        {isLoading && (
          <Box mt={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" ml={1}>
              Loading your settings...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Menu Cards */}
      <Grid container spacing={3} mb={4}>
        {menuCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleCardClick(card.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 3 }}>
                <Box mb={2}>
                  {card.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  size="small" 
                  variant="contained"
                  sx={{ 
                    backgroundColor: card.color,
                    '&:hover': {
                      backgroundColor: card.color,
                      opacity: 0.8,
                    },
                  }}
                >
                  Start Learning
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box textAlign="center">
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => navigate('/settings')}
          sx={{ mr: 2 }}
        >
          Settings
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/topics')}
        >
          Browse Topics
        </Button>
      </Box>

      {/* Footer Information */}
      <Box mt={6} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Desktop Version • Built with Electron and React
        </Typography>
      </Box>
    </Container>
  );
}