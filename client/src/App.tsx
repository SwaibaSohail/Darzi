function App() {
  return (
    <>
      <header className="px-8 py-6 border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-3xl text-[var(--color-primary)] inline-block"
            style={{
              fontFamily: 'var(--font-display)',
              borderBottom: '2px solid var(--color-accent)',
              paddingBottom: '2px',
            }}
          >
            Darzi
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-20">
        <section>
          <h2
            className="text-5xl font-semibold text-[var(--color-primary)] mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tailored to you.
          </h2>
          <p className="text-lg text-[var(--color-secondary)] mb-10 max-w-lg">
            Bespoke garments crafted with precision and care. Every stitch
            tells your story.
          </p>
          <button
            type="button"
            className="px-8 py-3 bg-[var(--color-primary)] text-white rounded transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] hover:bg-[var(--color-accent)]"
          >
            Book a Consultation
          </button>
        </section>
      </main>
    </>
  )
}

export default App
