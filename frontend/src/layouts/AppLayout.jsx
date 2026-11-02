import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import BottomNav from "../components/BottomNav/BottomNav";

import "./AppLayout.css";

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-layout__content">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}

export default AppLayout;
