// ipcUtilities.js
const { ipcRenderer } = window.require('electron');

export const getLanguages = (setLanguagesCallback) => {
  ipcRenderer.send('get-languages');
  ipcRenderer.once('get-languages-response', (event, response) => {
    const { error, languages } = response;
    if (!error) {
      setLanguagesCallback(languages);
    }
  });
};

export const getDifficultiesByLanguage = (language, setDifficultiesCallback) => {
  ipcRenderer.send('get-difficulty-by-language', { language });
  ipcRenderer.once('get-difficulty-by-language-response', (event, response) => {
    const { error, difficulty } = response;
    if (!error) {
      setDifficultiesCallback(difficulty);
    }
  });
};

export const getTopicsByLanguageDifficulty = (language, difficulty, setTopicsCallback) => {
  ipcRenderer.send('get-topics-by-language-difficulty', { language, difficulty });
  ipcRenderer.once('get-topics-by-language-difficulty-response', (event, response) => {
    const { error, topics } = response;
    if (!error) {
      setTopicsCallback(topics);
    }
  });
};

export const getRandomPairExercise = (language, difficulty, topic, setExercisesCallback) => {
  ipcRenderer.send('get-random-pair-exercise', { language, difficulty, topic });
  ipcRenderer.once('get-random-pair-exercise-response', (event, response) => {
    const { error, exercise } = response;
    if (!error) {
      setExercisesCallback(exercise);
    }
  });
};
