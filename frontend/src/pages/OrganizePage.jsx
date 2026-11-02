import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

import {
  ListTodo,
  CalendarDays,
  Lightbulb,
  Bookmark,
  Brain,
  ChevronDown,
} from "lucide-react";

import { useMindDumps } from "../hooks/useMindDumps";
import { organizeItems } from "../utils/organizeItems";

import "./OrganizePage.css";

// Velocità dei pensieri: più basso = movimento più lento.
const THOUGHT_SPEED = 0.7;

// Le cinque categorie restano uguali su desktop e mobile.
const categories = [
  {
    id: "da-fare",
    label: "Da fare",
    icon: ListTodo,
    color: "#ED8194",
  },
  {
    id: "in-programma",
    label: "In programma",
    icon: CalendarDays,
    color: "#C7B6ED",
  },
  {
    id: "forse",
    label: "Forse",
    icon: Lightbulb,
    color: "#E6B36C",
  },
  {
    id: "da-ricordare",
    label: "Da ricordare",
    icon: Bookmark,
    color: "#A9CDEB",
  },
  {
    id: "pensieri-liberi",
    label: "Pensieri liberi",
    icon: Brain,
    color: "#B8A9E8",
  },
];

// I fili rappresentano visivamente i pensieri.
// Non sono collegati ai singoli documenti MongoDB.
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

// I collegamenti desktop si diramano verso le categorie.
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

// Ogni filo ruota da solo, senza spostamenti verticali.
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

// Il nucleo è solo grafico: il testo resta fermo.
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

// Sul desktop evidenziamo il filo della categoria selezionata.
function MindConnections({ activeCategoryId }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      className="organize__connections"
      viewBox="0 0 1000 500"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Tratto tra il nucleo e la diramazione */}
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

// Usiamo la stessa lista di pensieri su desktop e mobile.
function ThoughtList({ items }) {
  if (items.length === 0) {
    return <p>Non ci sono pensieri in questa categoria.</p>;
  }

  return (
    <ul className="organize__list">
      {items.map((item) => (
        <li key={item.id} className="organize__item">
          <div>
            <strong>{item.title}</strong>

            {item.date && <p>Data: {item.date}</p>}

            {item.time && <p>Ora: {item.time}</p>}

            {item.uncertain === true && <p>Informazione da chiarire</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

// Categorie desktop: selezionano il pannello sotto la mappa.
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
            onClick={() => navigate(`/organizza/${id}`)}
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

// Sul mobile tocchiamo una categoria per aprirla.
// La categoria aperta è letta direttamente dall'URL.
function MobileCategories({
  selectedId,
  organizedItems,
  isLoading,
  error,
  navigate,
}) {
  function toggleCategory(id) {
    navigate(selectedId === id ? "/organizza" : `/organizza/${id}`);
  }

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

      {categories.map(({ id, label, icon: Icon, color }) => {
        const isExpanded = selectedId === id;
        const categoryItems = organizedItems[id] ?? [];
        const panelId = `organize-mobile-${id}`;

        return (
          <div
            key={id}
            className="organize__mobile-group"
            style={{ "--category-color": color }}
          >
            <button
              type="button"
              className={`organize__category organize__mobile-button ${
                isExpanded ? "organize__category--active" : ""
              }`}
              onClick={() => toggleCategory(id)}
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
                {isLoading || error ? "—" : categoryItems.length}
              </strong>

              <ChevronDown
                className="organize__mobile-chevron"
                size={18}
                aria-hidden="true"
              />
            </button>

            <div
              id={panelId}
              className="organize__mobile-panel"
              hidden={!isExpanded}
            >
              {!isLoading && !error && <ThoughtList items={categoryItems} />}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function OrganizePage() {
  const navigate = useNavigate();
  const { category } = useParams();

  // I dati arrivano sempre dal nostro hook esistente.
  const { items, isLoading, error } = useMindDumps();
  const organizedItems = organizeItems(items);

  // Sul desktop selezioniamo "Da fare" se manca la categoria.
  const activeCategory =
    categories.find((item) => item.id === category) ?? categories[0];

  // Sul mobile, senza categoria nell'URL, resta tutto chiuso.
  const mobileSelectedId = categories.some((item) => item.id === category)
    ? category
    : null;

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
          Qui trovi i pensieri che hai affidato ad ADHD Daily. Esplorali
          liberamente, senza dover organizzare nulla.
        </p>
      </section>

      <section className="organize__map" aria-label="Mappa dei pensieri">
        <MindCore />

        {/* I collegamenti curvi sono visibili sul desktop. */}
        <MindConnections activeCategoryId={activeCategory.id} />

        <DesktopCategories
          organizedItems={organizedItems}
          activeCategoryId={activeCategory.id}
          isLoading={isLoading}
          error={error}
          navigate={navigate}
        />

        {/* Sul telefono il collegamento diventa verticale. */}
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

      {/* Questo pannello viene mostrato solo sul desktop. */}
      <section className="organize__content" aria-live="polite">
        <h2>{activeCategory.label}</h2>

        {isLoading ? (
          <p role="status">Recuperiamo i tuoi pensieri...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : (
          <ThoughtList items={organizedItems[activeCategory.id] ?? []} />
        )}
      </section>
    </main>
  );
}

export default OrganizePage;
