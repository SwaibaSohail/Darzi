function App() {
  return (
    <>
      <header className="px-8 py-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl text-primary inline-block border-b-2 border-accent pb-0.5">
            Darzi
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-20">
        <section>
          <h2 className="font-display text-5xl font-semibold text-primary mb-6">
            Tailored to you.
          </h2>
          <p className="text-lg text-secondary mb-10 max-w-lg">
            Bespoke garments crafted with precision and care. Every stitch
            tells your story.
          </p>
          <button
            type="button"
            className="px-8 py-3 bg-primary text-white rounded transition-colors duration-200 cursor-pointer hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Book a Consultation
          </button>
        </section>
      </main>
    </>
  )
}

export default App
