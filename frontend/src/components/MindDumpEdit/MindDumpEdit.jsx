import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

import { MAX_TITLE_LENGTH, TYPE_LABELS, isValidTitle } from "../../config/mindDump";
import "./MindDumpEdit.css";

function MindDumpEdit({ item, onSave, onCancel }) {
  // Partiamo dai dati che Gemini ha già riconosciuto.
  const [formData, setFormData] = useState({
    type: item.type,
    title: item.title ?? "",
    date: item.date ?? "",
    time: item.time ?? "",
    uncertain: item.uncertain ?? false,
  });

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const title = formData.title.trim();

    if (!isValidTitle(formData.title)) return;

    // Aggiorniamo solo i dati modificati dall'utente.
    onSave({
      ...item,
      type: formData.type,
      title,
      date: formData.date || null,
      time: formData.time || null,
      uncertain: formData.uncertain,
    });
  }

  return (
    <section className="mind-edit">
      <button className="mind-edit__back" type="button" onClick={onCancel}>
        <ArrowLeft size={18} aria-hidden="true" />
        <span>Torna ai risultati</span>
      </button>

      <header className="mind-edit__header">
        <p className="mind-edit__eyebrow">Il pensiero resta tuo</p>

        <h1>Modifica il pensiero.</h1>

        <p>Correggi quello che l'IA non ha interpretato come volevi.</p>
      </header>

      <form className="mind-edit__form" onSubmit={handleSubmit}>
        <label className="mind-edit__field">
          <span>Titolo</span>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            maxLength={MAX_TITLE_LENGTH}
            required
          />
        </label>

        <label className="mind-edit__field">
          <span>Categoria</span>

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
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

        <label className="mind-edit__uncertain">
          <div>
            <strong>Informazione da verificare</strong>

            <span>Attivala quando qualcosa non è ancora certo.</span>
          </div>

          <input
            type="checkbox"
            name="uncertain"
            checked={formData.uncertain}
            onChange={handleChange}
          />
        </label>

        <button
          className="mind-edit__save"
          type="submit"
          disabled={!isValidTitle(formData.title)}
        >
          <span>Salva modifiche</span>
          <Check size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

export default MindDumpEdit;
