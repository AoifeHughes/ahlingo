import React from "react";
import SubpageTemplate from "./SubpageTemplate";

function Writing({ onBack }) {
  return (
    <SubpageTemplate title="Writing" onBack={onBack}>
      <div>Writing Page Content</div>
    </SubpageTemplate>
  );
}

export default Writing;
