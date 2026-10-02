import { BookOpen, Phone, ShoppingBag } from "lucide-react";
import "./TodayList.css";

function TodayList() {
  const activities = [
    {
      id: 1,
      title: "Studia React",
      time: "10:00",
      icon: BookOpen,
    },
    {
      id: 2,
      title: "Chiama il commercialista",
      time: "12:30",
      icon: Phone,
    },
    {
      id: 3,
      title: "Compra il latte",
      time: "18:00",
      icon: ShoppingBag,
    },
  ];

  return (
    <section className="today">
      <div className="today__header">
        <h2>Oggi</h2>

        <button className="today__view-all" type="button">
          Vedi tutto <span>›</span>
        </button>
      </div>

      <div className="today__list">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div className="today__item" key={activity.id}>
              <div className="today__icon">
                <Icon size={17} strokeWidth={1.5} />
              </div>

              <div className="today__content">
                <h3>{activity.title}</h3>
                <p>{activity.time}</p>
              </div>

              <button
                className="today__check"
                type="button"
                aria-label={`Completa ${activity.title}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TodayList;
