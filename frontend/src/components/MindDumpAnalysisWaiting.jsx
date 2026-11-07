import { useEffect, useState } from "react";

export default function MindDumpAnalysisWaiting() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="mind-dump-page__analysis" role="status" aria-live="polite" aria-atomic="true">
      <svg
        className="mind-dump-page__thought-gathering"
        viewBox="0 0 240 144"
        width="200"
        height="120"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g className="mind-dump-page__thought-line mind-dump-page__thought-line--lavender">
          <path d="M24 34 C34 17 48 49 60 32 S80 21 87 34" />
        </g>
        <g className="mind-dump-page__thought-line mind-dump-page__thought-line--rose">
          <path d="M157 29 C168 45 180 12 194 29 S214 45 222 28" />
        </g>
        <g className="mind-dump-page__thought-line mind-dump-page__thought-line--blue">
          <path d="M11 78 C25 58 36 96 49 75 S66 61 75 78" />
        </g>
        <g className="mind-dump-page__thought-line mind-dump-page__thought-line--rose">
          <path d="M38 121 C52 103 65 136 79 116 S97 103 105 120" />
        </g>
        <g className="mind-dump-page__thought-line mind-dump-page__thought-line--lavender">
          <path d="M160 101 C173 84 186 119 199 100 S216 87 228 103" />
        </g>
        <g className="mind-dump-page__thought-core">
          <circle cx="120" cy="72" r="15" fillOpacity="0.06" />
          <circle cx="120" cy="72" r="6.5" />
        </g>
      </svg>
      <p className="mind-dump-page__analysis-message">Sto dando forma ai tuoi pensieri</p>
    </div>
  );
}
