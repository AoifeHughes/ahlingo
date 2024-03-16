import React, { useState, useEffect } from "react";
import SubpageTemplate from "../templates/SubpageTemplate";
import Button from "@mui/material/Button";
import { Table, TableBody, TableCell, TableContainer, TableRow, Paper } from "@mui/material";
const { ipcRenderer } = window.require('electron');

function Pairs({ onBack }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [difficulties, setDifficulties] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [topics, setTopics] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    ipcRenderer.send('get-languages');
    ipcRenderer.on('get-languages-response', (event, response) => {
      const { error, languages } = response;
      if (!error) {
        setLanguages(languages);
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('get-languages-response');
    };
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      ipcRenderer.send('get-difficulty-by-language', { language: selectedLanguage });
      ipcRenderer.on('get-difficulty-by-language-response', (event, response) => {
        const { error, difficulty } = response;
        if (!error) {
          setDifficulties(difficulty);
        }
      });
    }

    return () => {
      ipcRenderer.removeAllListeners('get-difficulty-by-language-response');
    };
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage && selectedDifficulty) {
      ipcRenderer.send('get-topics-by-language-difficulty', { language: selectedLanguage, difficulty: selectedDifficulty });
      ipcRenderer.on('get-topics-by-language-difficulty-response', (event, response) => {
        const { error, topics } = response;
        if (!error) {
          setTopics(topics);
        }
      });
    }

    return () => {
      ipcRenderer.removeAllListeners('get-topics-by-language-difficulty-response');
    };
  }, [selectedLanguage, selectedDifficulty]);

  const handleLanguageClick = (language) => {
    setSelectedLanguage(language);
    setDifficulties([]);
    setSelectedDifficulty("");
    setTopics([]);
    setExercises([]);
  };

  const handleDifficultyClick = (difficulty) => {
    setSelectedDifficulty(difficulty);
    setTopics([]);
    setExercises([]);
  };

  const handleTopicClick = (topic) => {
    setExercises([]); // Reset exercises
    for (let i = 0; i < 10; i++) {
      ipcRenderer.send('get-random-pair-exercise', { language: selectedLanguage, difficulty: selectedDifficulty, topic });
    }

    ipcRenderer.on('get-random-pair-exercise-response', (event, response) => {
      const { error, exercise } = response;
      if (!error) {
        setExercises(prevExercises => [...prevExercises, exercise].slice(0, 10)); // Keep only the first 10 exercises
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('get-random-pair-exercise-response');
    };
  };

  const handleCellClick = (exerciseId) => {
    setSelectedCell(exerciseId);
  };

  const renderExerciseTable = () => (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableBody>
          {exercises.map((exercise, index) => (
            <TableRow key={index} hover>
              <TableCell
                component="th"
                scope="row"
                onClick={() => handleCellClick(exercise.exercise_name)}
                style={{ background: selectedCell === exercise.exercise_name ? '#f0f0f0' : '' }}
              >
                {exercise.language_2_content}
              </TableCell>
              <TableCell
                onClick={() => handleCellClick(exercise.exercise_name)}
                style={{ background: selectedCell === exercise.exercise_name ? '#f0f0f0' : '' }}
              >
                {exercise.language_1_content}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <SubpageTemplate title="Pairs">
      <div>
        {!selectedLanguage && languages.map((language, index) => (
          <Button key={index} onClick={() => handleLanguageClick(language)}>
            {language}
          </Button>
        ))}
        {selectedLanguage && !selectedDifficulty && difficulties.map((difficulty, index) => (
          <Button key={index} onClick={() => handleDifficultyClick(difficulty)}>
            {difficulty}
          </Button>
        ))}
        {selectedDifficulty && exercises.length === 0 && topics.map((topic, index) => (
          <Button key={index} onClick={() => handleTopicClick(topic)}>
            {topic}
          </Button>
        ))}
        {exercises.length > 0 && renderExerciseTable()}
      </div>
    </SubpageTemplate>
  );
}

export default Pairs;
