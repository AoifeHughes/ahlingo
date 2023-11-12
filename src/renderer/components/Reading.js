import React, { useState, useEffect } from "react";
import SubpageTemplate from "./SubpageTemplate";
const { ipcRenderer } = window.require('electron');

function Reading({ onBack }) {
  const [topics, setTopics] = useState([]);
  useEffect(() => {
    ipcRenderer.send('get-topics', 'french'); // Replace 'French' with the desired language

    ipcRenderer.on('get-topics-reply', (event, { error, topics }) => {
      if (error) {
        console.error("Error fetching topics:", error);
        return;
      }
      setTopics(topics);
    });

    // Clean up the listener
    return () => {
      ipcRenderer.removeAllListeners('get-topics-reply');
    };
  }, []);

  return (
    <SubpageTemplate title="Reading" onBack={onBack}>
      <div>
        <h2>Reading Page Content</h2>
        <div>
          {topics.map((topic, index) => (
            <button key={index} onClick={() => handleTopicClick(topic.name)}>
              {topic.name}
            </button>
          ))}
        </div>
      </div>
    </SubpageTemplate>
  );

  function handleTopicClick(topicName) {
    // Handle the topic button click here
    console.log("Clicked topic:", topicName);
  }
}

export default Reading;
