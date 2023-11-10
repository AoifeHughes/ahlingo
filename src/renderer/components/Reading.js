import React from "react";
import SubpageTemplate from "./SubpageTemplate";

function Reading({ onBack }) {
  return (
    <SubpageTemplate title="Reading" onBack={onBack}>
      <div>Reading Page Content</div>
    </SubpageTemplate>
  );
}

export default Reading;
