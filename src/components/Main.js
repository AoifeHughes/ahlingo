import React, { useState, useEffect, useRef } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { extractMainTextFromURL } from "../logic/Extraction";
import "react-tabs/style/react-tabs.css";
import { promises as fs } from "fs";
import { join } from "path";

function Main() {
  const [inputValue, setInputValue] = useState("");
  const [userInput, setUserInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [sentences, setSentences] = useState([]);
  const [evaluationOutput, setEvaluationOutput] = useState("");
  const [translationEvaluations, setTranslationEvaluations] = useState([]);
  const inputRef = useRef(null);

  // Define the path to the CSV file
  const csvFilePath = join(
    process.env.HOME || process.env.USERPROFILE,
    "translationEvaluations.csv"
  );

  useEffect(() => {
    // Load evaluations from file on component mount
    const loadEvaluations = async () => {
      try {
        const csvData = await fs.readFile(csvFilePath, "utf8");
        const evaluations = csvToEvaluations(csvData);
        setTranslationEvaluations(evaluations);
      } catch (error) {
        // Handle file read errors (e.g., file doesn't exist yet)
        console.error("Failed to read CSV file:", error);
      }
    };
    loadEvaluations();
  }, []);

  useEffect(() => {
    // Save evaluations to file whenever they change
    const csvData = evaluationsToCsv(translationEvaluations);
    fs.writeFile(csvFilePath, csvData).catch((error) => {
      console.error("Failed to write to CSV file:", error);
    });
  }, [translationEvaluations]);

  // Convert CSV string to evaluations array
  const csvToEvaluations = (csv) => {
    const lines = csv.split("\n").slice(1); // Exclude header
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
      .filter(Boolean); // Filter out nulls
  };

  // Convert evaluations array to CSV string
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
    // For now, the function just returns 0
    return 0;
  };

  const handleTranslationSubmission = () => {
    const score = evaluateTranslation(userInput, extractedText);
    setEvaluationOutput(score);

    // Update the translation evaluations
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
    <div className="main-content">
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

export default Main;
