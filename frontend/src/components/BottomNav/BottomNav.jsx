import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import {
  House,
  Cloud,
  ListChecks,
  Archive,
  Menu,
  X,
  CircleDot,
  BookOpen,
  Settings,
  UserRound,
  ChevronDown,
} from "lucide-react";

import "./BottomNav.css";

// Le quattro sezioni realmente disponibili.
const mainNavigation = [
  { path: "/", label: "Home", icon: House, end: true },
  { path: "/svuota", label: "Svuota", icon: Cloud },
  { path: "/organizza", label: "Organizza", icon: ListChecks },
  { path: "/archivio", label: "Archivio", icon: Archive },
];

// Le sezioni future rimangono visibili, ma non fingono di funzionare.
const upcomingNavigation = [
  {
    id: "focus",
    label: "Focus",
    icon: CircleDot,
    description: "La modalità Focus non è ancora disponibile.",
  },
  {
    id: "diario",
    label: "Diario",
    icon: BookOpen,
    description: "Il Diario arriverà in una versione successiva.",
  },
  {
    id: "impostazioni",
    label: "Impostazioni",
    icon: Settings,
    description: "Le impostazioni personali sono ancora in sviluppo.",
  },
  {
    id: "profilo",
    label: "Profilo",
    icon: UserRound,
    description: "La pagina del profilo non è ancora disponibile.",
  },
];

function BottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  // Permettiamo di chiudere il pannello anche con Escape.
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
    setExpandedItem(null);
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
              Queste funzionalità sono previste, ma non sono ancora disponibili.
            </p>

            <div className="bottom-nav__upcoming">
              {upcomingNavigation.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedItem === item.id;

                return (
                  <div className="bottom-nav__upcoming-card" key={item.id}>
                    <button
                      type="button"
                      className="bottom-nav__upcoming-button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedItem(isExpanded ? null : item.id)
                      }
                    >
                      <Icon size={19} aria-hidden="true" />

                      <span className="bottom-nav__upcoming-label">
                        {item.label}
                      </span>

                      <span className="bottom-nav__upcoming-status">
                        Prossimamente
                      </span>

                      <ChevronDown
                        className={
                          isExpanded
                            ? "bottom-nav__chevron bottom-nav__chevron--open"
                            : "bottom-nav__chevron"
                        }
                        size={16}
                        aria-hidden="true"
                      />
                    </button>

                    {isExpanded && (
                      <p className="bottom-nav__upcoming-description">
                        {item.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
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
            isMoreOpen ? "bottom-nav__item--active" : ""
          }`}
          aria-expanded={isMoreOpen}
          aria-controls="bottom-nav-more"
          onClick={() => {
            if (isMoreOpen) {
              closeMore();
            } else {
              setIsMoreOpen(true);
            }
          }}
        >
          <Menu size={20} strokeWidth={1.6} aria-hidden="true" />
          <span>Altro</span>
        </button>
      </nav>
    </>
  );
}

export default BottomNav;
