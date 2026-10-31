import { useNavigate, useParams } from "react-router-dom";
import { ListTodo, CalendarDays, AlertTriangle } from "lucide-react";

import { useMindDumps } from "../hooks/useMindDumps";
import { organizeItems } from "../utils/organizeItems";

import "./OrganizePage.css";

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

function OrganizePage() {
  const navigate = useNavigate();
  const { category } = useParams();

  // Recuperiamo gli elementi salvati nel database.
  const { items, isLoading, error } = useMindDumps();

  // Organizziamo gli elementi nelle tre categorie.
  const organizedItems = organizeItems(items);

  // Se non è stata selezionata una categoria,
  // mostriamo automaticamente "Da fare".
  const activeCategory =
    categories.find((item) => item.id === category) || categories[0];

  const visibleItems = organizedItems[activeCategory.id];

  return (
    <main className="organize">
      <header className="organize__header">
        <div className="organize__eyebrow">Il tuo spazio</div>

        <h1>Organizza</h1>

        <p>Una cosa alla volta, al tuo ritmo.</p>
      </header>

      <section className="organize__intro">
        <h2>Il tuo spazio, più chiaro.</h2>

        <p>Scegli cosa vuoi gestire adesso.</p>
      </section>

      <nav className="organize__categories" aria-label="Categorie di Organizza">
        {categories.map(({ id, label, icon: Icon, color }) => {
          const isActive = activeCategory.id === id;

          return (
            <button
              key={id}
              type="button"
              className={`organize__category ${
                isActive ? "organize__category--active" : ""
              }`}
              style={{ "--category-color": color }}
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
                {isLoading ? "—" : organizedItems[id].length}
              </strong>
            </button>
          );
        })}
      </nav>

      <section className="organize__content">
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
