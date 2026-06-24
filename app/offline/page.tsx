export default function OfflinePage() {
  return (
    <main className="app-container offline-page">
      <section className="card-bg offline-card">
        <div className="logo offline-logo">Toki</div>
        <h1>You’re offline</h1>
        <p>
          Saved tasks may still appear when the app shell is cached, but AI extraction and calendar export need a connection.
        </p>
        <a className="btn btn-primary" href="/">
          Return to dashboard
        </a>
      </section>
    </main>
  );
}
