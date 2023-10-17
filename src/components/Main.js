import React, { useState } from "react";
import TextTranslation from "./TextTranslation";

function Main() {
  const [view, setView] = useState("menu");

  return (
    <div className="main-content">
      {view === "menu" && (
        <div>
          <button onClick={() => setView("textTranslation")}>
            Text Translation
          </button>
          {/* Add more buttons for other views as needed */}
        </div>
      )}
      {view === "textTranslation" && (
        <div>
          <TextTranslation />
          <button onClick={() => setView("menu")}>Back to Menu</button>
        </div>
      )}
      {/* Similarly, add conditional renderings for other views when they're selected */}
    </div>
  );
}

export default Main;
