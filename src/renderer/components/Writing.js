import React from "react";
import SubpageTemplate from "./SubpageTemplate";

function Chatbot({ onBack }) {
  return (
    <SubpageTemplate title="Writing" onBack={onBack}>
      <div>Writing Page Content</div>
    </SubpageTemplate>
  );
}

export default Chatbot;
