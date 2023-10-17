import React, { useState, useRef } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { extractMainTextFromURL } from "../logic/Extraction";
import "react-tabs/style/react-tabs.css";

function Main() {
  const [inputValue, setInputValue] = useState("");
  const [extractedText, setExtractedText] = useState(""); // To store extracted text
  const inputRef = useRef(null);

  const handleSubmit = async () => {
    if (inputRef.current) {
      const result = await extractMainTextFromURL(inputRef.current.value);
      setExtractedText(result || "Failed to extract content."); // Set the state with the result
    }
  };

  return (
    <div className="main-content">
      <Tabs>
        <TabList>
          <Tab>Upload your own text</Tab>
          <Tab>Use a URL</Tab>
        </TabList>

        <TabPanel>
          <input type="file" />
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

      {/* Two side-by-side text areas */}
      <div style={{ display: "flex", marginTop: "20px" }}>
        <textarea
          style={{ flex: "1", marginRight: "10px" }}
          placeholder="Enter your text here..."
        />
        <textarea
          style={{ flex: "1" }}
          placeholder="Extracted content will appear here..."
          value={extractedText}
          readOnly
        />
      </div>
    </div>
  );
}

export default Main;
