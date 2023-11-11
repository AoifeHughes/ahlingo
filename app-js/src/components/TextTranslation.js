// import React, { useState, useEffect, useRef } from "react";
// import { promises as fs } from "fs";
// import { join } from "path";
// import AppBar from "@mui/material/AppBar";
// import Tabs from "@mui/material/Tabs";
// import Tab from "@mui/material/Tab";
// import Typography from "@mui/material/Typography";
// import Button from "@mui/material/Button";
// import TextField from "@mui/material/TextField";
// import Container from "@mui/material/Container";
// import Box from "@mui/material/Box";
// import { extractMainTextFromURL } from "../logic/extractMainTextFromURL";
// function TextTranslation() {
//   const [inputValue, setInputValue] = useState("");
//   const [userInput, setUserInput] = useState("");
//   const [extractedText, setExtractedText] = useState("");
//   const [sentences, setSentences] = useState([]);
//   const [evaluationOutput, setEvaluationOutput] = useState("");
//   const [translationEvaluations, setTranslationEvaluations] = useState([]);
//   const [tabIndex, setTabIndex] = useState(0);
//   const inputRef = useRef(null);

//   function TextTranslation() {
//     const [inputValue, setInputValue] = useState("");
//     const [userInput, setUserInput] = useState("");
//     const [extractedText, setExtractedText] = useState("");
//     const [sentences, setSentences] = useState([]);
//     const [evaluationOutput, setEvaluationOutput] = useState("");
//     const [translationEvaluations, setTranslationEvaluations] = useState([]);
//     const inputRef = useRef(null);

//     const csvFilePath = join(
//       process.env.HOME || process.env.USERPROFILE,
//       "translationEvaluations.csv"
//     );

//     useEffect(() => {
//       const loadEvaluations = async () => {
//         try {
//           const csvData = await fs.readFile(csvFilePath, "utf8");
//           const evaluations = csvToEvaluations(csvData);
//           setTranslationEvaluations(evaluations);
//         } catch (error) {
//           console.error("Failed to read CSV file:", error);
//         }
//       };
//       loadEvaluations();
//     }, []);

//     useEffect(() => {
//       const csvData = evaluationsToCsv(translationEvaluations);
//       fs.writeFile(csvFilePath, csvData).catch((error) => {
//         console.error("Failed to write to CSV file:", error);
//       });
//     }, [translationEvaluations]);

//     const csvToEvaluations = (csv) => {
//       const lines = csv.split("\n").slice(1);
//       return lines
//         .map((line) => {
//           const match = line.match(/"(.*?)","(.*?)","(.*?)"/);
//           if (match) {
//             const [, userInput, challengeSentence, score] = match;
//             return {
//               userInput: userInput.replace(/""/g, '"'),
//               challengeSentence: challengeSentence.replace(/""/g, '"'),
//               score: score.replace(/""/g, '"'),
//             };
//           }
//           return null;
//         })
//         .filter(Boolean);
//     };

//     const evaluationsToCsv = (evaluations) => {
//       const header = '"userInput","challengeSentence","score"\n';
//       const rows = evaluations
//         .map(
//           (e) =>
//             `"${e.userInput.replace(/"/g, '""')}",
//            "${e.challengeSentence.replace(/"/g, '""')}",
//            "${e.score}"`
//         )
//         .join("\n");
//       return header + rows;
//     };

//     const handleSubmit = async () => {
//       if (inputRef.current) {
//         const result = await extractMainTextFromURL(inputRef.current.value);
//         setExtractedText(result || "Failed to extract content.");
//       }
//     };

//     const handleFileUpload = (e) => {
//       const file = e.target.files[0];
//       if (file) {
//         const reader = new FileReader();
//         reader.onload = (evt) => {
//           const sentences = evt.target.result
//             .split(/[.!?]/)
//             .filter(Boolean)
//             .map((s) => s.trim());
//           setSentences(sentences);
//         };
//         reader.readAsText(file);
//       }
//     };

//     const getRandomSentence = () => {
//       const randomIndex = Math.floor(Math.random() * sentences.length);
//       setExtractedText(sentences[randomIndex]);
//     };

//     const evaluateTranslation = (userInput, challengeSentence) => {
//       return 0; // Placeholder function
//     };

//     const handleTranslationSubmission = () => {
//       const score = evaluateTranslation(userInput, extractedText);
//       setEvaluationOutput(score.toString());

//       setTranslationEvaluations((prev) => [
//         ...prev,
//         {
//           userInput: userInput,
//           challengeSentence: extractedText,
//           score: score,
//         },
//       ]);
//     };

//     const handleTabChange = (event, newValue) => {
//       setTabIndex(newValue);
//     };

//     return (
//       <Container>
//         <AppBar position="static">
//           <Tabs
//             value={tabIndex}
//             onChange={handleTabChange}
//             aria-label="simple tabs example"
//           >
//             <Tab label="Upload your own text" />
//             <Tab label="Use a URL" />
//           </Tabs>
//         </AppBar>

//         {tabIndex === 0 && (
//           <Box>
//             <input type="file" accept=".txt" onChange={handleFileUpload} />
//             {sentences.length > 0 && (
//               <Button
//                 variant="contained"
//                 color="primary"
//                 onClick={getRandomSentence}
//               >
//                 Get Random Sentence
//               </Button>
//             )}
//           </Box>
//         )}

//         {tabIndex === 1 && (
//           <Box>
//             <TextField
//               label="Enter a URL"
//               type="text"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               fullWidth
//               margin="normal"
//             />
//             <Button variant="contained" color="primary" onClick={handleSubmit}>
//               Submit
//             </Button>
//           </Box>
//         )}

//         <Box display="flex" marginTop={2}>
//           <TextField
//             label="Enter your text here..."
//             multiline
//             rows={4}
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             variant="outlined"
//             style={{ flex: 1, marginRight: "10px" }}
//           />
//           <TextField
//             label="Extracted content will appear here..."
//             multiline
//             rows={4}
//             value={extractedText}
//             InputProps={{ readOnly: true }}
//             variant="outlined"
//             style={{ flex: 1 }}
//           />
//         </Box>
//         <Button
//           variant="contained"
//           color="secondary"
//           onClick={handleTranslationSubmission}
//         >
//           Evaluate
//         </Button>
//         <Typography variant="body1" marginTop={2}>
//           Evaluation Result: {evaluationOutput}
//         </Typography>
//       </Container>
//     );
//   }
// }

// export default TextTranslation;
