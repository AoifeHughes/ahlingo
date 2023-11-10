import React, { useState, useEffect } from "react";
import { useLocation, Route, Routes } from "react-router-dom";

import MainAppBar from "./MainAppBar";
import Menu from "./Menu";
import Reading from "./Reading";
import Writing from "./Writing";
import Scenarios from "./Scenarios";
import Chatbot from "./Chatbot";
import Settings from "./Settings";
import UserInfo from "./UserInfo";

function Layout() {
  const [showMenu, setShowMenu] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setShowMenu(location.pathname === "/");
  }, [location]);

  return (
    <>
      <MainAppBar />
      <Menu showMenu={showMenu} setShowMenu={setShowMenu} />
      <Routes>
        <Route path="/" element={<div>Welcome! Select a menu option.</div>} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/user-info" element={<UserInfo />} />
      </Routes>
    </>
  );
}

export default Layout;
