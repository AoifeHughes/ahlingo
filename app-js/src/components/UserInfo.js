import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function UserInfo() {
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
            User Information
          </Typography>
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: 20 }}>
        <Paper elevation={3} style={{ padding: 16 }}>
          <List>
            <ListItem>
              <ListItemText primary="Name" secondary="Aoife H" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Email" secondary="A.H@example.com" />
            </ListItem>
            {/* Add more user information fields here */}
          </List>
        </Paper>
      </Container>
    </>
  );
}

export default UserInfo;
