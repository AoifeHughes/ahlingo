import React, { useState, useEffect } from "react";
import { useLocation, Route, Routes } from "react-router-dom";

import MainAppBar from "./MainAppBar";
import Menu from "./Menu";
import Conversation from "./exercises/Conversation";
import Translation from "./exercises/Translation";
import Pairs from "./exercises/Pairs";
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
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/pairs" element={<Pairs />} />
        <Route path="/translations" element={<Translation />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/user-info" element={<UserInfo />} />
      </Routes>
    </>
  );
}

export default Layout;
