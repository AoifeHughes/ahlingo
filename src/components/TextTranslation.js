import React, { useState, useEffect, useRef } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { extractMainTextFromURL } from "../logic/Extraction";
import "react-tabs/style/react-tabs.css";
import { promises as fs } from "fs";
import { join } from "path";

function TextTranslation() {
  const [inputValue, setInputValue] = useState("");
  const [userInput, setUserInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [sentences, setSentences] = useState([]);
  const [evaluationOutput, setEvaluationOutput] = useState("");
  const [translationEvaluations, setTranslationEvaluations] = useState([]);
  const inputRef = useRef(null);

  const csvFilePath = join(
    process.env.HOME || process.env.USERPROFILE,
    "translationEvaluations.csv"
  );

  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        const csvData = await fs.readFile(csvFilePath, "utf8");
        const evaluations = csvToEvaluations(csvData);
        setTranslationEvaluations(evaluations);
      } catch (error) {
        console.error("Failed to read CSV file:", error);
      }
    };
    loadEvaluations();
  }, []);

  useEffect(() => {
    const csvData = evaluationsToCsv(translationEvaluations);
    fs.writeFile(csvFilePath, csvData).catch((error) => {
      console.error("Failed to write to CSV file:", error);
    });
  }, [translationEvaluations]);

  const csvToEvaluations = (csv) => {
    const lines = csv.split("\n").slice(1);
    return lines
      .map((line) => {
        const match = line.match(/"(.*?)","(.*?)","(.*?)"/);
        if (match) {
          const [, userInput, challengeSentence, score] = match;
          return {
            userInput: userInput.replace(/""/g, '"'),
            challengeSentence: challengeSentence.replace(/""/g, '"'),
            score: score.replace(/""/g, '"'),
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const evaluationsToCsv = (evaluations) => {
    const header = '"userInput","challengeSentence","score"\n';
    const rows = evaluations
      .map(
        (e) =>
          `"${e.userInput.replace(/"/g, '""')}",
           "${e.challengeSentence.replace(/"/g, '""')}",
           "${e.score}"`
      )
      .join("\n");
    return header + rows;
  };

  const handleSubmit = async () => {
    if (inputRef.current) {
      const result = await extractMainTextFromURL(inputRef.current.value);
      setExtractedText(result || "Failed to extract content.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const sentences = evt.target.result
          .split(/[.!?]/)
          .filter(Boolean)
          .map((s) => s.trim());
        setSentences(sentences);
      };
      reader.readAsText(file);
    }
  };

  const getRandomSentence = () => {
    const randomIndex = Math.floor(Math.random() * sentences.length);
    setExtractedText(sentences[randomIndex]);
  };

  const evaluateTranslation = (userInput, challengeSentence) => {
    return 0; // Placeholder function
  };

  const handleTranslationSubmission = () => {
    const score = evaluateTranslation(userInput, extractedText);
    setEvaluationOutput(score.toString());

    setTranslationEvaluations((prev) => [
      ...prev,
      {
        userInput: userInput,
        challengeSentence: extractedText,
        score: score,
      },
    ]);
  };

  return (
    <div className="translation-content">
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
      <button onClick={handleTranslationSubmission}>Evaluate</button>
      <div>Evaluation Result: {evaluationOutput}</div>
    </div>
  );
}

export default TextTranslation;
