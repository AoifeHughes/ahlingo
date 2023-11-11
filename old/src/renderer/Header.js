import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">Welcome to AHLingo</Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
