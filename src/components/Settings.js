// In Settings.js

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  FormControlLabel,
  Switch,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function Settings() {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate(-1)}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" style={{ marginLeft: 20 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: 20 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <FormControlLabel
          control={<Switch name="setting1" />}
          label="Setting 1"
        />
        <FormControlLabel
          control={<Switch name="setting2" />}
          label="Setting 2"
        />
        {/* Add more settings options here */}{" "}
      </Container>
    </>
  );
}

export default Settings;
