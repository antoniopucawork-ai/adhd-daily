import { useState } from "react";
import { NavLink } from "react-router-dom";

import {
  Cloud,
  House,
  Archive,
  CircleDot,
  BookOpen,
  Settings,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import "./Sidebar.css";

const navigation = [
  { label: "Home", path: "/", icon: House },
  { label: "Svuota la mente", path: "/svuota", icon: Cloud },
  { label: "Archivio", path: "/archivio", icon: Archive },
];

const upcoming = [
  { label: "Focus", icon: CircleDot },
  { label: "Diario", icon: BookOpen },
];

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("adhdSidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((previous) => {
      const next = !previous;

      try {
        localStorage.setItem("adhdSidebarCollapsed", String(next));
      } catch {
        // La navigazione rimane utilizzabile anche senza localStorage.
      }

      return next;
    });
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""}`}
      aria-label="Barra laterale"
    >
      <div className="sidebar__brand">
        <div className="sidebar__brand-identity">
          <div className="sidebar__brand-icon">
            <Cloud size={21} strokeWidth={1.5} />
          </div>

          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">ADHD Daily</span>

            <span className="sidebar__brand-subtitle">
              Il tuo spazio mentale
            </span>
          </div>
        </div>
      </div>

      <button
        className="sidebar__toggle"
        type="button"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen size={19} strokeWidth={1.5} />
        ) : (
          <PanelLeftClose size={19} strokeWidth={1.5} />
        )}
      </button>

      <div className="sidebar__content">
        <p className="sidebar__section-label">IL TUO SPAZIO</p>

        {/* NAVIGAZIONE PRINCIPALE */}

        <nav
          className="sidebar__navigation"
          aria-label="Navigazione principale desktop"
        >
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              aria-label={label}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
            >
              <Icon
                className="sidebar__link-icon"
                size={19}
                strokeWidth={1.6}
              />

              <span className="sidebar__link-text">{label}</span>
            </NavLink>
          ))}
        </nav>

        <p className="sidebar__section-label sidebar__section-label--upcoming">
          PROSSIMAMENTE
        </p>

        <div className="sidebar__navigation sidebar__upcoming">
          {upcoming.map(({ label, icon: Icon }) => (
            <div
              className="sidebar__link sidebar__link--disabled"
              key={label}
              title={isCollapsed ? `${label} — Prossimamente` : undefined}
            >
              <Icon
                className="sidebar__link-icon"
                size={19}
                strokeWidth={1.6}
              />

              <span className="sidebar__link-text">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar__footer">
        {/* IMPOSTAZIONI */}

        <div className="sidebar__link sidebar__link--disabled">
          <Settings
            className="sidebar__link-icon"
            size={19}
            strokeWidth={1.6}
          />

          <span className="sidebar__link-text">Impostazioni</span>
        </div>

        {/* PROFILO */}

        <div className="sidebar__profile">
          <div className="sidebar__avatar">
            <UserRound size={20} strokeWidth={1.5} />
          </div>

          <div className="sidebar__profile-info">
            <span>Il tuo profilo</span>
            <small>Spazio personale</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
