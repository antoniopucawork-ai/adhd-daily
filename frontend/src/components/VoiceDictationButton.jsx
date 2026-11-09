import { Mic, Square } from "lucide-react";

function VoiceDictationButton({
  onClick,
  disabled = false,
  isListening = false,
}) {
  return (
    <button
      type="button"
      className={`voice-dictation-button ${
        isListening ? "voice-dictation-button--active" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={
        isListening ? "Interrompi la dettatura" : "Avvia la dettatura vocale"
      }
      aria-pressed={isListening}
    >
      {isListening ? (
        <Square size={14} aria-hidden="true" />
      ) : (
        <Mic size={17} aria-hidden="true" />
      )}

      <span>{isListening ? "Interrompi" : "Parla"}</span>
    </button>
  );
}

export default VoiceDictationButton;
