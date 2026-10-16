import { House, Cloud, CircleDot, BookOpen, UserRound } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import "./BottomNav.css";

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: House,
      path: "/",
    },
    {
      id: "mind-dump",
      label: "Svuota",
      icon: Cloud,
      path: "/svuota",
    },
    {
      id: "focus",
      label: "Focus",
      icon: CircleDot,
      path: "/focus",
    },
    {
      id: "diary",
      label: "Diario",
      icon: BookOpen,
      path: "/diario",
    },
    {
      id: "profile",
      label: "Profilo",
      icon: UserRound,
      path: "/profilo",
    },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <button
            className={`bottom-nav__item ${
              isActive ? "bottom-nav__item--active" : ""
            }`}
            type="button"
            key={item.id}
            onClick={() => navigate(item.path)}
          >
            <Icon size={19} strokeWidth={1.5} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
