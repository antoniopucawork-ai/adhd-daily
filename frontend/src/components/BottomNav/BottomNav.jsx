import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

import {
  House,
  LogOut,
  Cloud,
  ListChecks,
  CalendarDays,
  Archive,
  Settings,
  Menu,
  X,
} from "lucide-react";

import "./BottomNav.css";

// Le quattro destinazioni principali.
const mainNavigation = [
  { path: "/", label: "Home", icon: House, end: true },
  { path: "/svuota", label: "Svuota", icon: Cloud },
  { path: "/organizza", label: "Organizza", icon: ListChecks },
  { path: "/calendario", label: "Calendario", icon: CalendarDays },
];

// Le altre pagine realmente disponibili.
const moreNavigation = [
  { path: "/archivio", label: "Archivio", icon: Archive },
  { path: "/impostazioni", label: "Impostazioni", icon: Settings },
];

function BottomNav() {
  const { logout } = useAuth();
  const location = useLocation();

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Evidenziamo Altro quando siamo in una delle sue pagine.
  const isMoreActive =
    isMoreOpen ||
    moreNavigation.some((item) => item.path === location.pathname);

  useEffect(() => {
    if (!isMoreOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  function closeMore() {
    setIsMoreOpen(false);
  }

  return (
    <>
      {isMoreOpen && (
        <>
          <button
            type="button"
            className="bottom-nav__backdrop"
            aria-label="Chiudi il menu"
            onClick={closeMore}
          />

          <section
            className="bottom-nav__panel"
            aria-labelledby="bottom-nav-more-title"
            id="bottom-nav-more"
          >
            <div className="bottom-nav__panel-header">
              <div>
                <p className="bottom-nav__eyebrow">IL TUO SPAZIO</p>

                <h2 id="bottom-nav-more-title">Altre sezioni</h2>
              </div>

              <button
                type="button"
                className="bottom-nav__close"
                aria-label="Chiudi il menu"
                onClick={closeMore}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <p className="bottom-nav__panel-intro">
              Accedi al tuo archivio e personalizza il tuo spazio.
            </p>

            <nav className="bottom-nav__upcoming" aria-label="Altre sezioni">
              {moreNavigation.map(({ path, label, icon: Icon }) => (
                <div className="bottom-nav__upcoming-card" key={path}>
                  <NavLink
                    to={path}
                    onClick={closeMore}
                    className="bottom-nav__upcoming-button"
                    style={{ textDecoration: "none" }}
                  >
                    <Icon size={19} aria-hidden="true" />

                    <span className="bottom-nav__upcoming-label">{label}</span>
                  </NavLink>
                </div>
              ))}

              <div className="bottom-nav__upcoming-card">
                <button
                  type="button"
                  className="bottom-nav__upcoming-button"
                  onClick={logout}
                >
                  <LogOut size={19} aria-hidden="true" />

                  <span className="bottom-nav__upcoming-label">Esci</span>
                </button>
              </div>
            </nav>
          </section>
        </>
      )}

      <nav className="bottom-nav" aria-label="Navigazione principale mobile">
        {mainNavigation.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={closeMore}
            className={({ isActive }) =>
              `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`
            }
          >
            <Icon size={20} strokeWidth={1.6} aria-hidden="true" />

            <span>{label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className={`bottom-nav__item ${
            isMoreActive ? "bottom-nav__item--active" : ""
          }`}
          aria-expanded={isMoreOpen}
          aria-controls="bottom-nav-more"
          onClick={() => setIsMoreOpen((previous) => !previous)}
        >
          <Menu size={20} strokeWidth={1.6} aria-hidden="true" />

          <span>Altro</span>
        </button>
      </nav>
    </>
  );
}

export default BottomNav;
