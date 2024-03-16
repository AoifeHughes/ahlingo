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
  const [shuffledExercises, setShuffledExercises] = useState([]);
  const [matches, setMatches] = useState({});
  const [correctMatches, setCorrectMatches] = useState(0);

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

  useEffect(() => {
    if (exercises.length > 0) {
      const shuffled = shuffleExercises(exercises);
      setShuffledExercises(shuffled);
      setMatches({});
      setCorrectMatches(0);
    }
  }, [exercises]);

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
    ipcRenderer.send('get-random-pair-exercise', { language: selectedLanguage, difficulty: selectedDifficulty, topic });

    ipcRenderer.on('get-random-pair-exercise-response', (event, response) => {
      const { error, exercise } = response;
      console.log(response);
      if (!error) {
        console.log(exercise);
        setExercises(exercise); 
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('get-random-pair-exercise-response');
    };
  };

  const shuffleExercises = (exercises) => {
    const pairedExercises = exercises.map((e, i) => ({ id: i, ...e }));
    const shuffled = [...pairedExercises].sort(() => 0.5 - Math.random());
    return shuffled;
  };

  const handleCellClick = (exerciseId, languageContent) => {
    const currentSelection = { [exerciseId]: languageContent };

    if (Object.keys(matches).length === 0 || Object.keys(matches).length === 1 && !matches[exerciseId]) {
      setMatches({ ...matches, ...currentSelection });
    }

    if (Object.keys(matches).length === 1) {
      const [firstId] = Object.keys(matches);
      const firstContent = matches[firstId];
      if (exercises[firstId].language_2_content === languageContent || exercises[firstId].language_1_content === languageContent) {
        setCorrectMatches(correctMatches + 1);
        setMatches({});
      } else {
        setTimeout(() => {
          setMatches({});
        }, 1000);
      }
    }
  };

  const renderExerciseTable = (languageContentKey) => (
    <TableContainer component={Paper}>
      <Table aria-label="pairing game">
        <TableBody>
          {shuffledExercises.map((exercise, index) => (
            <TableRow key={index} hover>
              <TableCell
                component="th"
                scope="row"
                onClick={() => handleCellClick(index, exercise[languageContentKey])}
                style={{ background: matches[index] ? '#90ee90' : '', cursor: 'pointer' }}
              >
                {exercise[languageContentKey]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const handleResetClick = () => {
    setSelectedLanguage("");
    setSelectedDifficulty("");
    setTopics([]);
    setExercises([]);
    setMatches({});
    setCorrectMatches(0);
  };

  const renderExerciseTables = () => (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      {renderExerciseTable("language_1_content")}
      {renderExerciseTable("language_2_content")}
    </div>
  );

  return (
    <SubpageTemplate title="Pairs">
      <div>
        {correctMatches > 0 && <p>Correct Matches: {correctMatches}</p>}
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
        {selectedLanguage && selectedDifficulty && topics.length > 0 && (
          <>
            {topics.map((topic, index) => (
              <Button key={index} onClick={() => handleTopicClick(topic)}>
                {topic}
              </Button>
            ))}
            <Button onClick={handleResetClick}>Back</Button>
          </>
        )}
        {exercises.length > 0 && renderExerciseTables()}
      </div>
    </SubpageTemplate>
  );
}

export default Pairs;