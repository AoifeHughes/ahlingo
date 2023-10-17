import React, { useState, useEffect, useRef } from "react";
import TextTranslation from "./TextTranslation"; // Import the new component
import { promises as fs } from "fs";
import { join } from "path";
import { extractMainTextFromURL } from "../logic/Extraction";

function Main() {
  const [inputValue, setInputValue] = useState("");
  const [userInput, setUserInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [sentences, setSentences] = useState([]);
  const [evaluationOutput, setEvaluationOutput] = useState("");
  const [translationEvaluations, setTranslationEvaluations] = useState([]);
  const inputRef = useRef(null);
  const [currentView, setCurrentView] = useState("mainMenu"); // To manage navigation

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

  const evaluateTranslation = (userInput, challengeSentence) => {
    return 0; // TODO: Implement this
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

  const getRandomSentence = () => {
    const randomIndex = Math.floor(Math.random() * sentences.length);
    setExtractedText(sentences[randomIndex]);
  };

  if (currentView === "mainMenu") {
    return (
      <div className="main-content">
        <h2>Main Menu</h2>
        <button onClick={() => setCurrentView("textTranslation")}>
          Text Translation
        </button>
        {/* Add more options/buttons as needed */}
      </div>
    );
  }

  if (currentView === "textTranslation") {
    return (
      <div className="main-content">
        <button onClick={() => setCurrentView("mainMenu")}>
          Back to Main Menu
        </button>
        <TextTranslation
          extractedText={extractedText}
          setExtractedText={setExtractedText}
          userInput={userInput}
          setUserInput={setUserInput}
          handleFileUpload={handleFileUpload}
          getRandomSentence={getRandomSentence}
          sentences={sentences}
          handleTranslationSubmission={handleTranslationSubmission}
          evaluationOutput={evaluationOutput}
          inputRef={inputRef}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Additional conditional renderings for other views can be added similarly
}

export default Main;
