import { AuthorityPreview } from "../../../features/authority-preview";

export function HomePage() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Moviqo home">
          Moviqo
        </a>
        <nav className="app-nav" aria-label="Primary">
          <a href="#work">My work</a>
          <a href="#processes">Processes</a>
          <a href="#admin">Administration</a>
        </nav>
      </header>
      <main className="app-main">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Internal beta shell</p>
          <h1 id="page-title">Move work forward with clear ownership.</h1>
          <p className="lede">
            Moviqo keeps workflow decisions anchored to the server while this
            shell proves the application structure.
          </p>
        </section>
        <AuthorityPreview />
      </main>
    </div>
  );
}
