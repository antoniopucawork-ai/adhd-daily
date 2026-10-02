import { House, Cloud, CircleDot, BookOpen, UserRound } from "lucide-react";

import "./BottomNav.css";

function BottomNav() {
  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: House,
    },
    {
      id: "mind-dump",
      label: "Svuota",
      icon: Cloud,
    },
    {
      id: "focus",
      label: "Focus",
      icon: CircleDot,
    },
    {
      id: "diary",
      label: "Diario",
      icon: BookOpen,
    },
    {
      id: "profile",
      label: "Profilo",
      icon: UserRound,
    },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === "home";

        return (
          <button
            className={`bottom-nav__item ${
              isActive ? "bottom-nav__item--active" : ""
            }`}
            type="button"
            key={item.id}
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
