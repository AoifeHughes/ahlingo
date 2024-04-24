import React, { useState, useEffect } from "react";
import SubpageTemplate from "../templates/SubpageTemplate";
import Button from "@mui/material/Button";
import { getLanguages, getDifficultiesByLanguage, getTopicsByLanguageDifficulty, getRandomPairExercise } from "./ipcUtilities"; // Adjust the import path as necessary

function Pairs({ onBack }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [difficulties, setDifficulties] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [topics, setTopics] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [shuffledExercises, setShuffledExercises] = useState([]);
  const [matches, setMatches] = useState({});
  const [selectedPair, setSelectedPair] = useState(null); // Track the selected pair
  const [incorrectAttempts, setIncorrectAttempts] = useState({}); // Track incorrect attempts for flashing red

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
      setSelectedPair(null);
      setIncorrectAttempts({});
    }
  }, [exercises]);

  const handleExerciseClick = (id) => {
    // Logic to determine if a pair is matched, turn green or flash red
    const clickedExercise = shuffledExercises.find(exercise => exercise.id === id);

    if (selectedPair === null) {
      setSelectedPair(clickedExercise);
    } else if (selectedPair.pairId === clickedExercise.pairId) {
      setMatches({ ...matches, [selectedPair.id]: true, [id]: true });
      setSelectedPair(null);
    } else {
      setIncorrectAttempts({ ...incorrectAttempts, [selectedPair.id]: true, [id]: true });
      setTimeout(() => {
        setIncorrectAttempts({});
      }, 1000); // Remove incorrect highlight after 1 second
      setSelectedPair(null);
    }
  };

  const shuffleExercises = (exercises) => {
    const pairedExercises = exercises.map((e, i) => ({ id: i, pairId: Math.floor(i / 2), ...e }));
    const shuffled = [...pairedExercises].sort(() => 0.5 - Math.random());
    return shuffled;
  };

  const renderExerciseButtons = () => (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      {shuffledExercises.map((exercise, index) => (
        <Button
          key={index}
          onClick={() => handleExerciseClick(exercise.id)}
          style={{
            position: 'absolute',
            top: `${Math.random() * 250}px`, // Example of scattering, adjust as necessary
            left: `${Math.random() * (100 - index)}%`, // Prevent overlapping by adjusting based on index or other methods
            backgroundColor: matches[exercise.id] ? "#90ee90" : incorrectAttempts[exercise.id] ? "red" : "initial",
          }}
        >
          {exercise.language_1_content} / {exercise.language_2_content}
        </Button>
      ))}
    </div>
  );


  return (
    <SubpageTemplate title="Pairs">
      <div>
        <Button onClick={handleResetClick}>Reset</Button>
      </div>
      <div>
        {!selectedLanguage &&
          languages.map((language, index) => (
            <Button key={index} onClick={() => handleLanguageClick(language)}>
              {language}
            </Button>
          ))}
        {selectedLanguage &&
          !selectedDifficulty &&
          difficulties.map((difficulty, index) => (
            <Button
              key={index}
              onClick={() => handleDifficultyClick(difficulty)}
            >
              {difficulty}
            </Button>
          ))}
        {exercises.length < 1 &&
          selectedLanguage &&
          selectedDifficulty &&
          topics.length > 0 &&
          topics.map((topic, index) => (
            <Button key={index} onClick={() => handleTopicClick(topic)}>
              {topic}
            </Button>
          ))}
        {exercises.length > 0 && renderExerciseButtons()}
      </div>
    </SubpageTemplate>
  );
}


export default Pairs;
