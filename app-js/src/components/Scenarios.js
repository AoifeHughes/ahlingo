import React from "react";
import SubpageTemplate from "./SubpageTemplate";

function Scenarios({ onBack }) {
  return (
    <SubpageTemplate title="Scenario" onBack={onBack}>
      <div>Scenario Page Content</div>
    </SubpageTemplate>
  );
}

export default Scenarios;
