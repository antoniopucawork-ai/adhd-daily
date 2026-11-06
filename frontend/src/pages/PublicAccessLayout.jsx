import adhdDailySymbol from "../assets/adhd-daily-symbol-compact.svg";

import "./WelcomePage.css";

export default function PublicAccessLayout({ variant, eyebrow, title, description, children }) {
  return (
    <main className={`access-page access-page--${variant}`}>
      <div className="access-page__layout">
        <header className="access-page__intro">
          <div className="access-page__brand">
            <img src={adhdDailySymbol} alt="" width={746} height={542} />
            <span>ADHD Daily</span>
          </div>
          <p className="access-page__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="access-page__description">{description}</p>
        </header>
        {children}
      </div>
    </main>
  );
}
