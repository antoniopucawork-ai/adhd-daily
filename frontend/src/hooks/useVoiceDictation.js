import { useEffect, useRef, useState } from "react";

export function useVoiceDictation(onTranscript) {
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  function startListening() {
    if (!isSupported || recognitionRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.lang = "it-IT";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
    };

    recognition.onresult = (event) => {
      const phrases = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) phrases.push(text);
        }
      }

      if (phrases.length > 0) {
        onTranscriptRef.current(phrases.join(" "));
      }
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Consenti l'accesso al microfono in Chrome.",
        "audio-capture": "Nessun microfono disponibile.",
        "no-speech": "Non ho sentito la tua voce. Riprova.",
        network: "Il servizio vocale non è raggiungibile.",
      };

      setVoiceError(
        messages[event.error] || "La dettatura non è riuscita. Riprova.",
      );
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError("Impossibile avviare il microfono.");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;

      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    voiceError,
    startListening,
    stopListening,
  };
}
