import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Save,
  Settings2,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import { usePreferences } from "../context/usePreferences";
import { DEFAULT_HOME_MODULES, HOME_MODULE_INFO } from "../config/homeModules";

import "./SettingsPage.css";

// Ordina i moduli e assegna posizioni consecutive.
function normalizeModules(modules) {
  return [...modules]
    .sort((a, b) => a.order - b.order)
    .map((module, index) => ({
      id: module.id,
      enabled: module.enabled,
      order: index,
    }));
}

function SettingsPage() {
  const { user } = useAuth();

  const { preferences, homeModules, saveHomeModules, isLoading, error } =
    usePreferences();

  const [draft, setDraft] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  // Configurazione attualmente salvata.
  const savedModules = normalizeModules(homeModules);
  const savedSignature = JSON.stringify(savedModules);

  // Se arrivano nuove preferenze dal backend,
  // utilizziamo automaticamente i dati aggiornati.
  const draftModules =
    draft?.base === savedSignature ? draft.modules : savedModules;

  const hasChanges = JSON.stringify(draftModules) !== savedSignature;

  const canEdit = !isLoading && !error && Boolean(preferences);

  // Tutte le modifiche locali passano da questa funzione.
  function updateDraft(updater) {
    setDraft((previous) => {
      const current =
        previous?.base === savedSignature ? previous.modules : savedModules;

      return {
        base: savedSignature,
        modules: updater(current),
      };
    });

    setMessage("");
    setSaveError("");
  }

  function toggleModule(id) {
    if (!canEdit || isSaving) return;

    updateDraft((modules) =>
      modules.map((module) =>
        module.id === id ? { ...module, enabled: !module.enabled } : module,
      ),
    );
  }

  function moveModule(index, direction) {
    if (!canEdit || isSaving) return;

    updateDraft((modules) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= modules.length) {
        return modules;
      }

      const updated = [...modules];

      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];

      return updated.map((module, position) => ({
        ...module,
        order: position,
      }));
    });
  }

  function resetModules() {
    if (!canEdit || isSaving) return;

    updateDraft(() => normalizeModules(DEFAULT_HOME_MODULES));
  }

  async function handleSave() {
    if (!canEdit || isSaving || !hasChanges) return;

    setIsSaving(true);
    setMessage("");
    setSaveError("");

    try {
      await saveHomeModules(draftModules);

      setMessage("Preferenze salvate correttamente.");
    } catch (saveFailure) {
      if (saveFailure.name !== "AbortError" && saveFailure.status !== 401) {
        setSaveError("Impossibile salvare le preferenze. Riprova.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="settings-page">
      <header className="settings-page__header">
        <span className="settings-page__eyebrow">IL TUO SPAZIO</span>

        <h1>Impostazioni</h1>

        <p>Personalizza ADHD Daily secondo le tue esigenze.</p>
      </header>

      <section className="settings-page__section">
        <div className="settings-page__section-heading">
          <Settings2 size={21} aria-hidden="true" />

          <div>
            <h2>Personalizza la Home</h2>
            <p>Scegli cosa vedere e in quale ordine.</p>
          </div>
        </div>

        {isLoading && <p>Caricamento preferenze...</p>}

        {error && (
          <p role="alert" className="settings-page__error">
            {error}
          </p>
        )}

        {canEdit && (
          <>
            <div className="settings-page__modules">
              {draftModules.map((module, index) => {
                const info = HOME_MODULE_INFO[module.id];
                const title = info?.title ?? module.id;

                return (
                  <div key={module.id} className="settings-page__module">
                    <div className="settings-page__module-info">
                      <h3>{title}</h3>
                      <p>{info?.description}</p>
                    </div>

                    <div className="settings-page__module-actions">
                      <label className="settings-page__toggle">
                        <input
                          type="checkbox"
                          checked={module.enabled}
                          disabled={isSaving}
                          onChange={() => toggleModule(module.id)}
                        />
                        <span>Visibile</span>
                      </label>

                      <div className="settings-page__order">
                        <button
                          type="button"
                          disabled={isSaving || index === 0}
                          onClick={() => moveModule(index, -1)}
                          aria-label={`Sposta ${title} in alto`}
                        >
                          <ArrowUp size={18} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          disabled={
                            isSaving || index === draftModules.length - 1
                          }
                          onClick={() => moveModule(index, 1)}
                          aria-label={`Sposta ${title} in basso`}
                        >
                          <ArrowDown size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="settings-page__actions">
              <button
                type="button"
                className="settings-page__reset"
                onClick={resetModules}
                disabled={isSaving}
              >
                <RotateCcw size={17} aria-hidden="true" />
                Ripristina
              </button>

              <button
                type="button"
                className="settings-page__save"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                <Save size={17} aria-hidden="true" />

                {isSaving ? "Salvataggio..." : "Salva modifiche"}
              </button>
            </div>

            {message && (
              <p role="status" className="settings-page__success">
                {message}
              </p>
            )}

            {saveError && (
              <p role="alert" className="settings-page__error">
                {saveError}
              </p>
            )}
          </>
        )}
      </section>

      <section className="settings-page__section">
        <div className="settings-page__section-heading">
          <UserRound size={21} aria-hidden="true" />

          <div>
            <h2>Il tuo account</h2>
            <p>Le informazioni associate al tuo profilo.</p>
          </div>
        </div>

        <dl className="settings-page__account">
          <div>
            <dt>Nome</dt>
            <dd>{user?.firstName || "Non disponibile"}</dd>
          </div>

          <div>
            <dt>Email</dt>
            <dd>{user?.email || "Non disponibile"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

export default SettingsPage;
