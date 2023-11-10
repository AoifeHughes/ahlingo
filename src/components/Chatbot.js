import React from "react";
import SubpageTemplate from "./SubpageTemplate";

function Chatbot({ onBack }) {
  return (
    <SubpageTemplate title="Chatbot" onBack={onBack}>
      <div>Chatbot Page Content</div>
    </SubpageTemplate>
  );
}

export default Chatbot;
