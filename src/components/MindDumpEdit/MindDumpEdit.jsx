import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import "./MindDumpEdit.css";

function MindDumpEdit({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: item.title || "",
    date: item.date || "",
    time: item.time || "",
    reminder: item.reminder || false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.title.trim()) return;

    onSave({
      ...item,
      title: formData.title.trim(),
      date: formData.date || null,
      time: formData.time || null,
      reminder: formData.reminder,
    });
  };

  return (
    <section className="mind-edit">
      <button className="mind-edit__back" type="button" onClick={onCancel}>
        <ArrowLeft size={17} strokeWidth={1.6} />
        <span>Indietro</span>
      </button>

      <header className="mind-edit__header">
        <h1>Modifica</h1>
        <p>Sistema quello che vuoi cambiare.</p>
      </header>

      <form className="mind-edit__form" onSubmit={handleSubmit}>
        <label className="mind-edit__field">
          <span>Cosa devi fare</span>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
        </label>

        <div className="mind-edit__row">
          <label className="mind-edit__field">
            <span>Giorno</span>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </label>

          <label className="mind-edit__field">
            <span>Ora</span>

            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
            />
          </label>
        </div>

        <label className="mind-edit__reminder">
          <div>
            <strong>Promemoria</strong>
            <span>Ricordamelo quando serve.</span>
          </div>

          <input
            type="checkbox"
            name="reminder"
            checked={formData.reminder}
            onChange={handleChange}
          />
        </label>

        <button className="mind-edit__save" type="submit">
          <span>Salva modifiche</span>
          <Check size={18} strokeWidth={1.7} />
        </button>
      </form>
    </section>
  );
}

export default MindDumpEdit;
