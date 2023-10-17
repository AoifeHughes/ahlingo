import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

function TextTranslation({
  extractedText,
  setExtractedText,
  userInput,
  setUserInput,
  handleFileUpload,
  getRandomSentence,
  sentences,
  handleTranslationSubmission,
  evaluationOutput,
  inputRef,
  inputValue,
  setInputValue,
  handleSubmit,
}) {
  return (
    <div>
      <Tabs>
        <TabList>
          <Tab>Upload your own text</Tab>
          <Tab>Use a URL</Tab>
        </TabList>

        <TabPanel>
          <input type="file" accept=".txt" onChange={handleFileUpload} />
          {sentences.length > 0 && (
            <button onClick={getRandomSentence}>Get Random Sentence</button>
          )}
        </TabPanel>
        <TabPanel>
          <input
            type="text"
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a URL"
          />
          <button onClick={handleSubmit}>Submit</button>
        </TabPanel>
      </Tabs>

      <div style={{ display: "flex", marginTop: "20px" }}>
        <textarea
          style={{ flex: "1", marginRight: "10px" }}
          placeholder="Enter your text here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <textarea
          style={{ flex: "1" }}
          placeholder="Extracted content will appear here..."
          value={extractedText}
          readOnly
        />
      </div>
      <button onClick={handleTranslationSubmission}>Submit translation</button>
      {evaluationOutput && (
        <textarea
          style={{ marginTop: "20px", width: "100%" }}
          placeholder="Evaluation result will appear here..."
          value={evaluationOutput}
          readOnly
        />
      )}
    </div>
  );
}

export default TextTranslation;
