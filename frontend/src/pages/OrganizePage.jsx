import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ListTodo, CalendarDays, AlertTriangle } from "lucide-react";

import { useMindDumps } from "../hooks/useMindDumps";
import { organizeItems } from "../utils/organizeItems";

import "./OrganizePage.css";

// ========================================
// CONFIGURAZIONE DEL MOVIMENTO
// ========================================

// 1 = velocità originale
// 1.6 = velocità attuale
// 2 = movimento più rapido

const THOUGHT_SPEED = 0.9;

// ========================================
// CATEGORIE ATTUALI
// ========================================

const categories = [
  {
    id: "da-fare",
    label: "Da fare",
    icon: ListTodo,
    color: "#ED8194",
  },
  {
    id: "eventi",
    label: "Eventi",
    icon: CalendarDays,
    color: "#C7B6ED",
  },
  {
    id: "da-verificare",
    label: "Da verificare",
    icon: AlertTriangle,
    color: "#E6B36C",
  },
];

// ========================================
// FILI DEI PENSIERI
// ========================================

// Ogni filo contiene:
// - un percorso SVG aperto;
// - un colore;
// - la posizione del puntino finale;
// - una durata di rotazione;
// - una direzione.
//
// I fili non cambiano forma:
// ruotano soltanto intorno al centro.

const thoughtStrands = [
  {
    id: "thought-1",
    color: "#F0A5C3",
    duration: 14,
    direction: 1,
    path: "M 77 184 C 65 118 102 72 171 56",
    end: { x: 171, y: 56 },
  },
  {
    id: "thought-2",
    color: "#D9C3FF",
    duration: 18,
    direction: -1,
    path: "M 228 57 C 298 51 352 101 351 167",
    end: { x: 351, y: 167 },
  },
  {
    id: "thought-3",
    color: "#ED9AB9",
    duration: 16,
    direction: 1,
    path: "M 350 225 C 342 291 297 343 235 350",
    end: { x: 235, y: 350 },
  },
  {
    id: "thought-4",
    color: "#B6A9ED",
    duration: 21,
    direction: -1,
    path: "M 189 354 C 117 357 67 311 58 252",
    end: { x: 58, y: 252 },
  },
  {
    id: "thought-5",
    color: "#A9CDEB",
    duration: 12,
    direction: 1,
    path: "M 110 134 C 130 100 168 90 210 103",
    end: { x: 210, y: 103 },
  },
  {
    id: "thought-6",
    color: "#E9B8D3",
    duration: 17,
    direction: -1,
    path: "M 273 113 C 311 148 321 193 297 230",
    end: { x: 297, y: 230 },
  },
  {
    id: "thought-7",
    color: "#C7B6ED",
    duration: 15,
    direction: 1,
    path: "M 271 269 C 235 309 188 319 151 292",
    end: { x: 151, y: 292 },
  },
  {
    id: "thought-8",
    color: "#A9CDEB",
    duration: 19,
    direction: -1,
    path: "M 125 282 C 88 259 82 220 99 182",
    end: { x: 99, y: 182 },
  },
  {
    id: "thought-9",
    color: "#F2B6D0",
    duration: 13,
    direction: 1,
    path: "M 95 94 C 119 69 149 62 179 70",
    end: { x: 179, y: 70 },
  },
];

// ========================================
// SINGOLO PENSIERO ANIMATO
// ========================================

function ThoughtStrand({ strand, reduceMotion }) {
  const rotation = strand.direction * 360;

  const rotationDuration = strand.duration / THOUGHT_SPEED;

  return (
    <motion.g
      className="organize__strand"
      initial={{ rotate: 0 }}
      animate={reduceMotion ? { rotate: 0 } : { rotate: [0, rotation] }}
      transition={{
        duration: rotationDuration,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      }}
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
// ========================================
// NUCLEO DEI PENSIERI
// ========================================

function MindCore() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="organize__core">
      {/* Luce ambientale */}

      <div className="organize__core-glow" aria-hidden="true" />

      {/* Fili che ruotano intorno al centro */}

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

      {/* Scritta centrale immobile */}

      <div className="organize__core-label">
        <span>I miei</span>
        <span>pensieri</span>
      </div>
    </div>
  );
}

// ========================================
// COLLEGAMENTI ALLE CATEGORIE
// ========================================

const connections = [
  {
    id: "da-fare",
    path: "M 380 195 C 440 195 450 60 510 60",
  },
  {
    id: "eventi",
    path: "M 380 195 C 435 195 455 195 510 195",
  },
  {
    id: "da-verificare",
    path: "M 380 195 C 440 195 450 330 510 330",
  },
];

function MindConnections({ activeCategoryId }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      className="organize__connections"
      viewBox="0 0 1000 390"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
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
              duration: reduceMotion ? 0 : 0.4,
            }}
          />
        );
      })}
    </svg>
  );
}

// ========================================
// PAGINA ORGANIZZA
// ========================================

function OrganizePage() {
  const navigate = useNavigate();
  const { category } = useParams();

  // Recuperiamo i dati salvati nel database.
  const { items, isLoading, error } = useMindDumps();

  // Conserviamo la classificazione esistente.
  const organizedItems = organizeItems(items);

  // Categoria selezionata o predefinita.
  const activeCategory =
    categories.find((item) => item.id === category) ?? categories[0];

  const visibleItems = organizedItems[activeCategory.id] ?? [];

  return (
    <main className="organize">
      {/* INTESTAZIONE */}

      <header className="organize__header">
        <div className="organize__eyebrow">Il tuo spazio</div>

        <h1>Organizza</h1>

        <p>I tuoi pensieri, al loro posto.</p>
      </header>

      {/* INTRODUZIONE */}

      <section className="organize__intro">
        <h2>Ritrova ciò che hai in mente.</h2>

        <p>
          Qui trovi i pensieri che hai affidato ad ADHD Daily. Esplorali
          liberamente, senza dover organizzare nulla.
        </p>
      </section>

      {/* MAPPA INTERATTIVA */}

      <section className="organize__map" aria-label="Mappa dei pensieri">
        <MindCore />

        <MindConnections activeCategoryId={activeCategory.id} />

        {/* CATEGORIE */}

        <nav
          className="organize__categories"
          aria-label="Categorie di Organizza"
        >
          {categories.map(({ id, label, icon: Icon, color }) => {
            const isActive = activeCategory.id === id;

            return (
              <button
                key={id}
                type="button"
                className={`organize__category ${
                  isActive ? "organize__category--active" : ""
                }`}
                style={{
                  "--category-color": color,
                }}
                onClick={() => navigate(`/organizza/${id}`)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="organize__category-icon"
                  size={24}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />

                <span className="organize__category-label">{label}</span>

                <strong className="organize__category-count">
                  {isLoading ? "—" : (organizedItems[id]?.length ?? 0)}
                </strong>
              </button>
            );
          })}
        </nav>
      </section>

      {/* PENSIERI DELLA CATEGORIA */}

      <section className="organize__content" aria-live="polite">
        <h2>{activeCategory.label}</h2>

        {isLoading ? (
          <p>Recuperiamo i tuoi pensieri...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : visibleItems.length === 0 ? (
          <p>Non ci sono elementi in questa categoria.</p>
        ) : (
          <ul className="organize__list">
            {visibleItems.map((item) => (
              <li key={item.id} className="organize__item">
                <div>
                  <strong>{item.title}</strong>

                  {item.date && <p>Data: {item.date}</p>}

                  {item.time && <p>Ora: {item.time}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default OrganizePage;
