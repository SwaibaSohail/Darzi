import { Link } from 'react-router'

export function HomePage() {
  return (
    <section>
      <h2 className="font-display text-5xl font-semibold text-primary mb-6">Tailored to you.</h2>
      <p className="text-lg text-secondary mb-10 max-w-lg">
        Bespoke garments crafted with precision and care. Every stitch tells your story.
      </p>
      <Link
        to="/products"
        className="inline-block px-8 py-3 bg-primary text-white rounded transition-colors duration-200 cursor-pointer hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Browse the Collection
      </Link>
    </section>
  )
}
