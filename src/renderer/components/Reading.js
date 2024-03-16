import React, { useState, useEffect } from "react";
import SubpageTemplate from "./SubpageTemplate";
import Button from "@mui/material/Button";
const { ipcRenderer } = window.require("electron");

function Reading({ onBack }) {
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    ipcRenderer.send("get-difficulty-levels");

    ipcRenderer.on(
      "get-difficulty-levels-reply",
      (event, { error, levels }) => {
        if (error) {
          console.error("Error fetching difficulty levels:", error);
          return;
        }
        setDifficultyLevels(levels);
      }
    );

    // Cleanup
    return () => {
      ipcRenderer.removeAllListeners("get-difficulty-levels-reply");
      ipcRenderer.removeAllListeners("get-topics-reply");
      ipcRenderer.removeAllListeners("get-languages-reply");
    };
  }, []);

  const handleDifficultyClick = (level) => {
    setSelectedDifficulty(level);
    ipcRenderer.send("get-topics", level);
    // Listener for topics
    ipcRenderer.on("get-topics-reply", (event, { error, topics }) => {
      if (error) {
        console.error("Error fetching topics:", error);
        return;
      }
      setTopics(topics);
    });
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    ipcRenderer.send("get-languages", {
      difficulty: selectedDifficulty,
      topic,
    });
    // Listener for languages
    ipcRenderer.on("get-languages-reply", (event, { error, languages }) => {
      if (error) {
        console.error("Error fetching languages:", error);
        return;
      }
      setLanguages(languages);
    });
  };

  return (
    <SubpageTemplate title="Reading" onBack={onBack}>
      <div>
        <h2>Reading Page Content</h2>
        {selectedTopic ? (
          <div>
            <Button onClick={() => setSelectedTopic("")}>Back to Topics</Button>
            {/* Display languages here */}
          </div>
        ) : selectedDifficulty ? (
          <div>
            <Button onClick={() => setSelectedDifficulty("")}>
              Back to Difficulty Levels
            </Button>
            {topics.map((topic, index) => (
              <Button key={index} onClick={() => handleTopicClick(topic.topic)}>
                {topic.topic}
              </Button>
            ))}
          </div>
        ) : (
          difficultyLevels.map((level, index) => (
            <Button
              key={index}
              onClick={() => handleDifficultyClick(level.difficulty_level)}
            >
              {level.difficulty_level}
            </Button>
          ))
        )}
      </div>
    </SubpageTemplate>
  );
}

export default Reading;
