import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

export function SettingsScreen(): JSX.Element {
  const dispatch = useAppDispatch();
  const { settings, availableLanguages, availableDifficulties, isLoading } = useAppSelector(
    (state) => state.userSettings
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Language Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Language Preferences
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Target Language</InputLabel>
              <Select
                value={settings?.language.id || ''}
                label="Target Language"
                disabled={isLoading}
              >
                {availableLanguages.map((language) => (
                  <MenuItem key={language.id} value={language.id}>
                    {language.language}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={settings?.difficulty.id || ''}
                label="Difficulty Level"
                disabled={isLoading}
              >
                {availableDifficulties.map((difficulty) => (
                  <MenuItem key={difficulty.id} value={difficulty.id}>
                    {difficulty.difficulty_level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              API Configuration
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="API Endpoint"
              placeholder="https://api.example.com"
              value={settings?.apiConfig?.endpoint || ''}
              helperText="Optional: Custom API endpoint for advanced features"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="API Key"
              type="password"
              placeholder="Enter your API key"
              value={settings?.apiConfig?.apiKey || ''}
              helperText="Optional: API key for chatbot and advanced features"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Current Settings
            </Typography>
          </Grid>

          {settings && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Language:</strong> {settings.language.language}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Difficulty:</strong> {settings.difficulty.difficulty_level}
                </Typography>
                <Typography variant="body2">
                  <strong>User ID:</strong> {settings.userId}
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                disabled={isLoading}
              >
                Save Settings
              </Button>
              <Button
                variant="outlined"
                size="large"
                disabled={isLoading}
              >
                Reset to Default
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}