import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useNavigate } from 'react-router-dom';
import { loadTopics, setCurrentTopic } from '../store/slices/exerciseSlice';

export function TopicSelectionScreen(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { topics, isLoading } = useAppSelector((state) => state.exercise);
  const { settings } = useAppSelector((state) => state.userSettings);

  useEffect(() => {
    dispatch(loadTopics());
  }, [dispatch]);

  const handleTopicSelect = (topic: any) => {
    dispatch(setCurrentTopic(topic));
    navigate(`/pairs-game/${topic.id}`);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" ml={2}>
            Loading topics...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Choose a Topic
        </Typography>
        {settings && (
          <Typography variant="subtitle1" color="text.secondary">
            Learning {settings.language.language} at {settings.difficulty.difficulty_level} level
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {topics.map((topic) => (
          <Grid item xs={12} sm={6} md={4} key={topic.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {topic.topic}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Practice exercises for {topic.topic.toLowerCase()}
                </Typography>
                <Box>
                  <Chip label="Pairs Game" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Conversation" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Translation" size="small" sx={{ mb: 1 }} />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="large"
                  variant="contained"
                  fullWidth
                  onClick={() => handleTopicSelect(topic)}
                >
                  Start Learning
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {topics.length === 0 && !isLoading && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No topics available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please check your settings or try refreshing the page
          </Typography>
        </Box>
      )}
    </Container>
  );
}