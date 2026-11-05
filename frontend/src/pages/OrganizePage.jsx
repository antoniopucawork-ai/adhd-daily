import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

import {
  ListTodo,
  CalendarDays,
  Lightbulb,
  Bookmark,
  Brain,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { useMindDumps } from "../hooks/useMindDumps";

import { organizeItems, getCompletedItems } from "../utils/organizeItems";

import { TYPE_LABELS } from "../config/mindDump";
import "./OrganizePage.css";

// Velocità dei pensieri: più basso = più lento.
const THOUGHT_SPEED = 0.7;

// Le cinque categorie principali.
const categories = [
  {
    id: "da-fare",
    label: TYPE_LABELS.ACTION,
    icon: ListTodo,
    color: "#ED8194",
  },
  {
    id: "in-programma",
    label: TYPE_LABELS.EVENT,
    icon: CalendarDays,
    color: "#C7B6ED",
  },
  {
    id: "forse",
    label: TYPE_LABELS.INTENTION,
    icon: Lightbulb,
    color: "#E6B36C",
  },
  {
    id: "da-ricordare",
    label: TYPE_LABELS.MEMORY,
    icon: Bookmark,
    color: "#A9CDEB",
  },
  {
    id: "pensieri-liberi",
    label: TYPE_LABELS.THOUGHT,
    icon: Brain,
    color: "#B8A9E8",
  },
];

// Filtro trasversale, non una sesta categoria IA.
const verificationFilter = {
  id: "da-verificare",
  label: "Da verificare",
  icon: AlertTriangle,
  color: "#E6B36C",
};

const allSections = [...categories, verificationFilter];

// Fili animati del nucleo centrale.
// Non rappresentano singoli documenti del database.
const thoughtStrands = [
  {
    id: 1,
    color: "#F0A5C3",
    duration: 14,
    direction: 1,
    path: "M 77 184 C 65 118 102 72 171 56",
    end: { x: 171, y: 56 },
  },
  {
    id: 2,
    color: "#D9C3FF",
    duration: 18,
    direction: -1,
    path: "M 228 57 C 298 51 352 101 351 167",
    end: { x: 351, y: 167 },
  },
  {
    id: 3,
    color: "#ED9AB9",
    duration: 16,
    direction: 1,
    path: "M 350 225 C 342 291 297 343 235 350",
    end: { x: 235, y: 350 },
  },
  {
    id: 4,
    color: "#B6A9ED",
    duration: 21,
    direction: -1,
    path: "M 189 354 C 117 357 67 311 58 252",
    end: { x: 58, y: 252 },
  },
  {
    id: 5,
    color: "#A9CDEB",
    duration: 12,
    direction: 1,
    path: "M 110 134 C 130 100 168 90 210 103",
    end: { x: 210, y: 103 },
  },
  {
    id: 6,
    color: "#E9B8D3",
    duration: 17,
    direction: -1,
    path: "M 273 113 C 311 148 321 193 297 230",
    end: { x: 297, y: 230 },
  },
  {
    id: 7,
    color: "#C7B6ED",
    duration: 15,
    direction: 1,
    path: "M 271 269 C 235 309 188 319 151 292",
    end: { x: 151, y: 292 },
  },
  {
    id: 8,
    color: "#A9CDEB",
    duration: 19,
    direction: -1,
    path: "M 125 282 C 88 259 82 220 99 182",
    end: { x: 99, y: 182 },
  },
  {
    id: 9,
    color: "#F2B6D0",
    duration: 13,
    direction: 1,
    path: "M 95 94 C 119 69 149 62 179 70",
    end: { x: 179, y: 70 },
  },
];

// Cinque collegamenti grafici, uno per categoria.
const connections = [
  {
    id: "da-fare",
    path: "M 380 250 C 440 250 445 39 510 39",
  },
  {
    id: "in-programma",
    path: "M 380 250 C 440 250 445 145 510 145",
  },
  {
    id: "forse",
    path: "M 380 250 C 440 250 450 250 510 250",
  },
  {
    id: "da-ricordare",
    path: "M 380 250 C 440 250 445 355 510 355",
  },
  {
    id: "pensieri-liberi",
    path: "M 380 250 C 440 250 445 461 510 461",
  },
];

// Animazione di un singolo filo.
function ThoughtStrand({ strand, reduceMotion }) {
  return (
    <motion.g
      className="organize__strand"
      initial={{ rotate: 0 }}
      animate={{
        rotate: reduceMotion ? 0 : [0, strand.direction * 360],
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: strand.duration / THOUGHT_SPEED,
              repeat: Infinity,
              ease: "linear",
            }
      }
      style={{
        transformBox: "view-box",
        transformOrigin: "center",
      }}
    >
      <path d={strand.path} stroke={strand.color} />

      <circle
        className="organize__thought-dot"
        cx={strand.end.x}
        cy={strand.end.y}
        r={3.3}
        fill={strand.color}
      />
    </motion.g>
  );
}

// Nucleo animato della mappa.
function MindCore() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="organize__core">
      <div className="organize__core-glow" aria-hidden="true" />

      <svg
        className="organize__core-traces"
        viewBox="0 0 400 400"
        aria-hidden="true"
      >
        {thoughtStrands.map((strand) => (
          <ThoughtStrand
            key={strand.id}
            strand={strand}
            reduceMotion={reduceMotion}
          />
        ))}
      </svg>

      <div className="organize__core-label">
        <span>I miei</span>
        <span>pensieri</span>
      </div>
    </div>
  );
}

// Collegamenti animati sul desktop.
function MindConnections({ activeCategoryId }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      className="organize__connections"
      viewBox="0 0 1000 500"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="organize__connection"
        d="M 335 250 C 355 250 365 250 380 250"
        opacity="0.7"
      />

      {connections.map(({ id, path }) => {
        const isActive = activeCategoryId === id;

        return (
          <motion.path
            key={id}
            d={path}
            className={`organize__connection ${
              isActive ? "organize__connection--active" : ""
            }`}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0.4,
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.3,
            }}
          />
        );
      })}
    </svg>
  );
}

// Lista condivisa fra desktop e mobile.
function ThoughtList({ items, isVerification = false }) {
  if (items.length === 0) {
    return (
      <p>
        {isVerification
          ? "Non ci sono informazioni da verificare."
          : "Non ci sono pensieri in questa categoria."}
      </p>
    );
  }

  return (
    <ul className="organize__list">
      {items.map((item) => (
        <li key={item.id} className="organize__item">
          <div>
            <strong>{item.title}</strong>

            {item.date && <p>Data: {item.date}</p>}

            {item.time && <p>Ora: {item.time}</p>}

            {item.uncertain === true && (
              <p className="organize__uncertain">
                <AlertTriangle size={14} strokeWidth={1.6} aria-hidden="true" />
                Informazione da chiarire
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// Categorie principali sulla mappa desktop.
function DesktopCategories({
  organizedItems,
  activeCategoryId,
  isLoading,
  error,
  navigate,
}) {
  return (
    <nav className="organize__categories" aria-label="Categorie di Organizza">
      {categories.map(({ id, label, icon: Icon, color }) => {
        const isActive = activeCategoryId === id;

        return (
          <button
            key={id}
            type="button"
            className={`organize__category ${
              isActive ? "organize__category--active" : ""
            }`}
            style={{ "--category-color": color }}
            onClick={() => {
              navigate(`/organizza/${id}`);

              document.getElementById("organize-results")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            aria-pressed={isActive}
          >
            <Icon
              className="organize__category-icon"
              size={24}
              strokeWidth={1.6}
              aria-hidden="true"
            />

            <span className="organize__category-label">{label}</span>

            <strong className="organize__category-count">
              {isLoading || error ? "—" : (organizedItems[id]?.length ?? 0)}
            </strong>
          </button>
        );
      })}
    </nav>
  );
}

// Singola categoria espandibile su mobile.
function MobileCategoryGroup({
  section,
  selectedId,
  organizedItems,
  isLoading,
  error,
  navigate,
}) {
  const { id, label, icon: Icon, color } = section;

  const isExpanded = selectedId === id;
  const sectionItems = organizedItems[id] ?? [];
  const panelId = `organize-mobile-${id}`;

  const toggleCategory = () => {
    navigate(isExpanded ? "/organizza" : `/organizza/${id}`);
  };

  return (
    <div
      className="organize__mobile-group"
      style={{ "--category-color": color }}
    >
      <button
        type="button"
        className={`organize__category organize__mobile-button ${
          isExpanded ? "organize__category--active" : ""
        }`}
        onClick={toggleCategory}
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        <Icon
          className="organize__category-icon"
          size={22}
          strokeWidth={1.6}
          aria-hidden="true"
        />

        <span className="organize__category-label">{label}</span>

        <strong className="organize__category-count">
          {isLoading || error ? "—" : sectionItems.length}
        </strong>

        <ChevronDown
          className="organize__mobile-chevron"
          size={18}
          aria-hidden="true"
        />
      </button>

      <div id={panelId} className="organize__mobile-panel" hidden={!isExpanded}>
        {!isLoading && !error && (
          <ThoughtList
            items={sectionItems}
            isVerification={id === verificationFilter.id}
          />
        )}
      </div>
    </div>
  );
}

// Navigazione mobile: cinque categorie più un filtro.
function MobileCategories({
  selectedId,
  organizedItems,
  isLoading,
  error,
  navigate,
}) {
  return (
    <nav
      className="organize__mobile-categories"
      aria-label="Esplora i tuoi pensieri"
    >
      {isLoading && (
        <p role="status" className="organize__mobile-status">
          Recuperiamo i tuoi pensieri...
        </p>
      )}

      {error && (
        <p role="alert" className="organize__mobile-status">
          {error}
        </p>
      )}

      {categories.map((section) => (
        <MobileCategoryGroup
          key={section.id}
          section={section}
          selectedId={selectedId}
          organizedItems={organizedItems}
          isLoading={isLoading}
          error={error}
          navigate={navigate}
        />
      ))}

      <div className="organize__mobile-filter-heading">
        <span>Da controllare</span>
      </div>

      <MobileCategoryGroup
        section={verificationFilter}
        selectedId={selectedId}
        organizedItems={organizedItems}
        isLoading={isLoading}
        error={error}
        navigate={navigate}
      />
    </nav>
  );
}

// Pagina principale.
function OrganizePage() {
  const navigate = useNavigate();
  const { category } = useParams();

  const { items, isLoading, error } = useMindDumps();

  // Tutti i gruppi derivano dai dati MongoDB.
  const organizedItems = organizeItems(items);
  const completedItems = getCompletedItems(items);

  // Desktop: categoria predefinita "Da fare".
  const activeCategory =
    allSections.find((section) => section.id === category) ?? categories[0];

  // Mobile: senza categoria nell'URL è tutto chiuso.
  const mobileSelectedId = allSections.some(
    (section) => section.id === category,
  )
    ? category
    : null;

  const verificationCount = organizedItems[verificationFilter.id]?.length ?? 0;

  const isVerificationActive = activeCategory.id === verificationFilter.id;

  const toggleVerification = () => {
    navigate(isVerificationActive ? "/organizza" : "/organizza/da-verificare");
  };

  return (
    <main className="organize">
      <header className="organize__header">
        <div className="organize__eyebrow">Il tuo spazio</div>

        <h1>Organizza</h1>

        <p>I tuoi pensieri, al loro posto.</p>
      </header>

      <section className="organize__intro">
        <h2>Ritrova ciò che hai in mente.</h2>

        <p>
          Esplora i tuoi pensieri, scegli come organizzarli e individua ciò che
          richiede un chiarimento.
        </p>
      </section>

      <section className="organize__map" aria-label="Mappa dei pensieri">
        <MindCore />

        <MindConnections activeCategoryId={activeCategory.id} />

        <DesktopCategories
          organizedItems={organizedItems}
          activeCategoryId={activeCategory.id}
          isLoading={isLoading}
          error={error}
          navigate={navigate}
        />

        <svg
          className="organize__mobile-bridge"
          viewBox="0 0 100 44"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M 50 0 C 50 24 10 8 2 44" />
        </svg>

        <MobileCategories
          selectedId={mobileSelectedId}
          organizedItems={organizedItems}
          isLoading={isLoading}
          error={error}
          navigate={navigate}
        />
      </section>

      {/* Pannello degli elementi su desktop */}
      <section
        id="organize-results"
        className="organize__content"
        aria-live="polite"
      >
        {" "}
        <div className="organize__content-top">
          <h2>{activeCategory.label}</h2>

          <button
            type="button"
            className={`organize__review-filter ${
              isVerificationActive ? "organize__review-filter--active" : ""
            }`}
            onClick={toggleVerification}
            aria-pressed={isVerificationActive}
          >
            <AlertTriangle size={17} aria-hidden="true" />

            <span>Da verificare</span>

            <strong>{isLoading || error ? "—" : verificationCount}</strong>
          </button>
        </div>
        {isLoading ? (
          <p role="status">Recuperiamo i tuoi pensieri...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : (
          <ThoughtList
            items={organizedItems[activeCategory.id] ?? []}
            isVerification={isVerificationActive}
          />
        )}
      </section>
      {/* Sezione trasversale: non è una categoria del Mind Engine. */}
      <section className="organize__completed" aria-label="Elementi completati">
        <details className="organize__completed-details">
          <summary className="organize__completed-summary">
            <span className="organize__completed-title">
              <CheckCircle2 size={20} aria-hidden="true" />
              Completate
            </span>

            <span className="organize__completed-count">
              {isLoading || error ? "—" : completedItems.length}
            </span>

            <ChevronDown
              className="organize__completed-chevron"
              size={18}
              aria-hidden="true"
            />
          </summary>

          <div className="organize__completed-body">
            {isLoading ? (
              <p role="status">Recuperiamo i tuoi pensieri...</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : completedItems.length === 0 ? (
              <p>Non hai ancora elementi completati.</p>
            ) : (
              <ul className="organize__list">
                {completedItems.map((item) => (
                  <li
                    key={item.id}
                    className="organize__item organize__completed-item"
                  >
                    <strong>{item.title}</strong>
                    {item.date && <p>Data prevista: {item.date}</p>}
                    {item.time && <p>Ora prevista: {item.time}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </section>
    </main>
  );
}

export default OrganizePage;
