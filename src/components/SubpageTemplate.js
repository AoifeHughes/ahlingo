import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function SubpageTemplate({ title, children }) {
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
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: 20 }}>{children}</Container>
    </>
  );
}

export default SubpageTemplate;
