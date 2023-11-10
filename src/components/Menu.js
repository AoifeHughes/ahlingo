import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Grid, Paper, IconButton } from "@mui/material";
import ReadIcon from "@mui/icons-material/Book";
import WriteIcon from "@mui/icons-material/Create";
import ScenarioIcon from "@mui/icons-material/Explore";
import ChatIcon from "@mui/icons-material/Chat";

function Menu({ showMenu, setShowMenu }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Show the menu when the user navigates back to the main page
    if (location.pathname === "/") {
      setShowMenu(true);
    }
  }, [location, setShowMenu]);

  const handleNavigation = (path) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1, display: showMenu ? "flex" : "none" }}>
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
