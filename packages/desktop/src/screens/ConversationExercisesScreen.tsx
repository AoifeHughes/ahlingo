import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function ConversationExercisesScreen(): JSX.Element {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Conversation Exercises
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Coming Soon!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Practice real conversations with interactive dialogues, voice recognition, 
          and native speaker audio. This feature will help you improve your speaking 
          and listening skills.
        </Typography>
        
        <Box mt={4}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Back to Main Menu
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/topics')}
          >
            Choose Topic
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}