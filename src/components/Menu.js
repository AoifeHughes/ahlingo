import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Paper, IconButton } from "@mui/material";
import ReadIcon from "@mui/icons-material/Book";
import WriteIcon from "@mui/icons-material/Create";
import ScenarioIcon from "@mui/icons-material/Explore";
import ChatIcon from "@mui/icons-material/Chat";

function Menu() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper elevation={3} onClick={() => handleNavigation("/reading")}>
            <IconButton>
              <ReadIcon />
            </IconButton>
            <div>Reading</div>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper elevation={3} onClick={() => handleNavigation("/writing")}>
            <IconButton>
              <WriteIcon />
            </IconButton>
            <div>Writing</div>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper elevation={3} onClick={() => handleNavigation("/scenarios")}>
            <IconButton>
              <ScenarioIcon />
            </IconButton>
            <div>Scenarios</div>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper elevation={3} onClick={() => handleNavigation("/chatbot")}>
            <IconButton>
              <ChatIcon />
            </IconButton>
            <div>Chatbot</div>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Menu;
