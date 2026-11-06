import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

import {
  House,
  LogOut,
  Archive,
  ListChecks,
  CalendarDays,
  Settings,
  Cloud,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import adhdDailySymbol from "../../assets/adhd-daily-symbol.svg";

import "./Sidebar.css";

const navigation = [
  { label: "Home", path: "/", icon: House },
  { label: "Svuota la mente", path: "/svuota", icon: Cloud },
  { label: "Organizza", path: "/organizza", icon: ListChecks },
  { label: "Calendario", path: "/calendario", icon: CalendarDays },
  { label: "Archivio", path: "/archivio", icon: Archive },
];

function Sidebar() {
  const { logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("adhdSidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  function toggleSidebar() {
    setIsCollapsed((previous) => {
      const next = !previous;

      try {
        localStorage.setItem("adhdSidebarCollapsed", String(next));
      } catch {
        // La navigazione resta disponibile.
      }

      return next;
    });
  }

  return (
    <aside
      className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""}`}
      aria-label="Barra laterale"
    >
      <div className="sidebar__brand">
        <div className="sidebar__brand-identity">
          <div className="sidebar__brand-icon">
            <img
              src={adhdDailySymbol}
              alt=""
              className="sidebar__brand-image"
              aria-hidden="true"
            />
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
                aria-hidden="true"
              />

              <span className="sidebar__link-text">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar__footer">
        <NavLink
          to="/impostazioni"
          aria-label="Impostazioni"
          title={isCollapsed ? "Impostazioni" : undefined}
          className={({ isActive }) =>
            `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
          }
        >
          <Settings
            className="sidebar__link-icon"
            size={19}
            strokeWidth={1.6}
            aria-hidden="true"
          />

          <span className="sidebar__link-text">Impostazioni</span>
        </NavLink>

        <button
          className="sidebar__link"
          type="button"
          onClick={logout}
          aria-label="Esci"
          title="Esci"
        >
          <LogOut className="sidebar__link-icon" size={19} aria-hidden="true" />

          <span className="sidebar__link-text">Esci</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
