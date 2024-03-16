import React, { useState, useEffect } from "react";
import SubpageTemplate from "../templates/SubpageTemplate";
import Button from "@mui/material/Button";
import { Table, TableBody, TableCell, TableContainer, TableRow, Paper } from "@mui/material";
import { getLanguages, getDifficultiesByLanguage, getTopicsByLanguageDifficulty, getRandomPairExercise } from './ipcUtilities'; // Adjust the import path as necessary

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
    getLanguages(setLanguages);
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      getDifficultiesByLanguage(selectedLanguage, setDifficulties);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage && selectedDifficulty) {
      getTopicsByLanguageDifficulty(selectedLanguage, selectedDifficulty, setTopics);
    }
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
    getRandomPairExercise(selectedLanguage, selectedDifficulty, topic, setExercises);
  };

  const shuffleExercises = (exercises) => {
    const pairedExercises = exercises.map((e, i) => ({ id: i, ...e }));
    const shuffled = [...pairedExercises].sort(() => 0.5 - Math.random());
    return shuffled;
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
    setShuffledExercises([]);
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
        <Button onClick={handleResetClick}>Reset</Button>
      </div>
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
        {exercises.length < 1 && selectedLanguage && selectedDifficulty && topics.length > 0 && topics.map((topic, index) => (
          <Button key={index} onClick={() => handleTopicClick(topic)}>
            {topic}
          </Button>
        ))}
        {exercises.length > 0 && renderExerciseTables()}
      </div>
    </SubpageTemplate>
  );
}

export default Pairs;
