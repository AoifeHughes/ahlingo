import React, { useState, useEffect } from "react";
import SubpageTemplate from "./SubpageTemplate";
import {
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

function Writing({ onBack }) {
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    // Fetch levels using IPC
    window.ipcRenderer.invoke("get-levels").then((fetchedLevels) => {
      setLevels(fetchedLevels);
    });
  }, []);

  const handleLevelClick = (level) => {
    setSelectedLevel(level);
    setSelectedTopic(null); // Reset selected topic
    setExercises([]); // Clear exercises
    // Fetch topics for the selected level using IPC
    window.ipcRenderer
      .invoke("get-topics-by-level", level)
      .then((fetchedTopics) => {
        setTopics(fetchedTopics);
      });
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    // Fetch exercises for the selected topic using IPC
    window.ipcRenderer
      .invoke("get-exercises-by-topic", topic)
      .then((fetchedExercises) => {
        setExercises(fetchedExercises);
      });
  };

  return (
    <SubpageTemplate title="Writing" onBack={onBack}>
      {!selectedLevel ? (
        <Grid container spacing={2}>
          {levels.map((level, index) => (
            <Grid item key={index}>
              <Button
                variant="contained"
                onClick={() => handleLevelClick(level)}
              >
                {level}
              </Button>
            </Grid>
          ))}
        </Grid>
      ) : !selectedTopic ? (
        <Grid container spacing={2}>
          {topics.map((topic, index) => (
            <Grid item key={index}>
              <Button
                variant="contained"
                onClick={() => handleTopicClick(topic)}
              >
                {topic}
              </Button>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>French</TableCell>
                <TableCell align="right">English</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exercises.map((exercise, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    {exercise.french}
                  </TableCell>
                  <TableCell align="right">{exercise.english}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SubpageTemplate>
  );
}

export default Writing;
