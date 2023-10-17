import React, { useState, useRef } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

function Main() {
  const [inputValue, setInputValue] = useState(""); // state to manage input value
  const inputRef = useRef(null); // ref to access input element directly

  // Function that will be called when the button is pressed
  const handleSubmit = () => {
    if (inputRef.current) {
      processInput(inputRef.current.value); // pass input value to your function
    }
  };

  // Sample function to process the input
  const processInput = (value) => {
    console.log(value);
    // Your logic here
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
    </div>
  );
}

export default Main;
