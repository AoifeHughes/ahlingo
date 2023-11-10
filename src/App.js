import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Menu from "./components/Menu";
import Reading from "./components/Reading";
import Writing from "./components/Writing";
import Scenarios from "./components/Scenarios";
import Chatbot from "./components/Chatbot";

function App() {
  return (
    <Router>
      <Menu />
      <Routes>
        <Route path="/reading" element={<Reading />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/" element={<Reading />} />
      </Routes>
    </Router>
  );
}

export default App;
