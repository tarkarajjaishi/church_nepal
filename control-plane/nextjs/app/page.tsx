import Link from "next/link";

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-brand">
          <span className="lp-logo" />
          <span>ChurchNepal</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </div>
      </nav>

      {/* Hero */}
      <header className="lp-hero">
        <div className="lp-glow" />
        <span className="lp-eyebrow">Church websites, done right</span>
        <h1>
          Give every church <span className="grad">its own website</span>
          <br /> in seconds.
        </h1>
        <p className="lp-lead">
          ChurchNepal spins up a complete site for each church — its own subdomain,
          its own database, its own storage. One platform, many churches, fully isolated.
        </p>
        <div className="lp-hero-cta">
          <Link href="/admin" className="lp-btn lp-btn-lg">Open Master Control →</Link>
          <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">See how it works</a>
        </div>
        <div className="lp-pills">
          <span>⛪ 1 subdomain / church</span>
          <span>🗄️ Separate database</span>
          <span>📦 Separate storage</span>
          <span>🔑 Instant admin login</span>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="lp-section">
        <h2 className="lp-h2">Everything each church needs, isolated by design</h2>
        <p className="lp-sub2">Data never crosses between churches. Provision in one click.</p>
        <div className="lp-grid">
          {[
            { i: "🌐", t: "Own subdomain", d: "Each church lives at yourchurch.churchnepal.com — clean, brandable, instant." },
            { i: "🗄️", t: "Isolated database", d: "A dedicated Postgres database per church. Members, giving, and content stay fully separate." },
            { i: "📦", t: "Private storage", d: "A separate media folder per church. Photos and uploads never mix." },
            { i: "✏️", t: "Headless CMS", d: "Every section — text, images, lists — editable from the admin. No code, no developers." },
            { i: "🔑", t: "Instant admin", d: "An admin login is auto-generated for each church the moment it's created." },
            { i: "🎨", t: "Beautiful themes", d: "Each church gets a polished, modern website that looks great on every device out of the box." },
          ].map((f) => (
            <div key={f.t} className="lp-feature">
              <span className="lp-feature-icon">{f.i}</span>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-section lp-how">
        <h2 className="lp-h2">From name to live site in three steps</h2>
        <div className="lp-steps">
          <div className="lp-step">
            <span className="lp-step-n">1</span>
            <h3>Name the church</h3>
            <p>Type the church name in Master Control and hit create.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-n">2</span>
            <h3>We provision everything</h3>
            <p>A subdomain, a database, a storage folder, and an admin login — automatically.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-n">3</span>
            <h3>The church takes over</h3>
            <p>They edit their own site from the admin. You oversee every church from one place.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Ready to launch a church?</h2>
        <p>Open Master Control and create your first church website now.</p>
        <Link href="/admin" className="lp-btn lp-btn-lg">Open Master Control →</Link>
      </section>

      <footer className="lp-footer">
        <span className="lp-brand"><span className="lp-logo" /> ChurchNepal</span>
        <a className="lp-credit" href="https://tarkarajjaishi.com.np/" target="_blank" rel="noreferrer">Developed by Tarka Raj Jaishi</a>
      </footer>
    </div>
  );
}
