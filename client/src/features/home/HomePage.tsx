import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { customApi } from '../custom/api'
import { fetchProducts } from '../catalog/api'
import { ProductCard } from '../catalog/ProductCard'
import { formatPKR } from '../../lib/money'

function Hero() {
  return (
    <section className="relative -mx-6 sm:-mx-8 -mt-12 sm:-mt-16 mb-4 bg-ink text-cream overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 12px, #D4A63F 12px, #D4A63F 13px)',
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, #D4A63F 0%, transparent 70%)' }}
      />
      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-20 lg:py-28 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold mb-6">
            Bespoke tailoring · Est. by hand
          </p>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.04] mb-6 text-cream">
            Tailored to you.
            <span className="block italic font-medium text-gold mt-1">Stitch by stitch.</span>
          </h2>
          <p className="text-lg text-cream/70 mb-10 max-w-md leading-relaxed">
            Ready-made garments, fine fabrics, and custom stitching cut to your exact
            measurements — with your tailor one message away.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-block px-8 py-3.5 bg-gold text-ink font-medium rounded-lg shadow-lg shadow-gold/20 transition-all duration-200 cursor-pointer hover:bg-cream hover:shadow-cream/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Browse the Collection
            </Link>
            <Link
              to="/custom"
              className="inline-block px-8 py-3.5 border border-cream/30 text-cream rounded-lg transition-colors duration-200 cursor-pointer hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Start Custom Stitching
            </Link>
          </div>
          <dl className="flex gap-10 mt-12 pt-8 border-t border-cream/15">
            {[
              ['6-stage', 'live order tracking'],
              ['1:1 chat', 'with your tailor'],
              ['Your fit', 'saved measurement profiles'],
            ].map(([stat, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl text-gold">{stat}</dt>
                <dd className="text-xs text-cream/60 mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hidden lg:block relative h-112" aria-hidden="true">
          <div className="absolute top-0 right-8 w-56 h-76 bg-wine rounded-2xl rotate-3 shadow-2xl" />
          <div className="absolute top-10 right-32 w-56 h-76 bg-gold rounded-2xl -rotate-3 shadow-2xl" />
          <div className="absolute top-20 right-16 w-56 h-76 bg-cream rounded-2xl rotate-1 shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-0.5 bg-wine mb-4" />
              <p className="font-display text-2xl text-ink leading-snug">
                "The fit makes
                <br />
                the man."
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-ink/10" />
              <div className="h-1.5 rounded-full bg-ink/10 w-4/5" />
              <div className="h-1.5 rounded-full bg-ink/10 w-3/5" />
            </div>
          </div>
          <svg
            className="absolute -bottom-2 left-0 text-gold"
            width="200"
            height="60"
            viewBox="0 0 200 60"
            fill="none"
          >
            <path
              d="M4 50 C 45 10, 90 55, 135 25 S 196 20, 196 20"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    n: '01',
    title: 'Choose',
    body: 'Pick a ready-made piece, or start a custom order with shop fabric or your own.',
  },
  {
    n: '02',
    title: 'Measure',
    body: 'Enter measurements once, save them as a profile, and reuse them on every order.',
  },
  {
    n: '03',
    title: 'Track & chat',
    body: 'Watch your order move from cutting to stitching live, and message the tailor anytime.',
  },
]

function HowItWorks() {
  return (
    <section
      className="-mx-6 sm:-mx-8 mt-4 mb-16 bg-surface border-y border-border"
      aria-labelledby="how-heading"
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-wine mb-3">The process</p>
        <h3 id="how-heading" className="font-display text-4xl text-ink mb-12">
          How it works
        </h3>
        <div className="grid sm:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative">
              <p className="font-display text-6xl text-gold mb-3">{step.n}</p>
              <div className="w-8 h-0.5 bg-wine mb-4" />
              <h4 className="font-semibold text-ink mb-2">{step.title}</h4>
              <p className="text-sm text-secondary leading-relaxed">{step.body}</p>
              {i < STEPS.length - 1 && (
                <svg
                  className="hidden sm:block absolute top-8 -right-7 text-wine/40"
                  width="40"
                  height="12"
                  viewBox="0 0 40 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 6 H34 M34 6 L28 1 M34 6 L28 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ServicesStrip() {
  const { data } = useQuery({ queryKey: ['services'], queryFn: customApi.listServices })
  if (!data || data.items.length === 0) return null
  return (
    <section
      className="-mx-6 sm:-mx-8 my-16 bg-ink text-cream relative overflow-hidden"
      aria-labelledby="services-heading"
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 12px, #C79A3C 12px, #C79A3C 13px)',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold mb-3">Made to measure</p>
            <h3 id="services-heading" className="font-display text-4xl text-cream">
              Custom stitching
            </h3>
          </div>
          <Link to="/custom" className="text-sm text-gold hover:text-cream transition-colors duration-150 whitespace-nowrap">
            Start an order →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.items.map((service) => (
            <Link
              key={service.id}
              to="/custom"
              className="group rounded-xl p-5 bg-cream/[0.04] border border-cream/15 transition-all duration-200 hover:-translate-y-1 hover:border-gold/60 hover:bg-cream/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <div className="w-6 h-0.5 mb-4 bg-gold transition-all duration-300 group-hover:w-10" />
              <h4 className="font-display text-xl mb-1 text-cream">{service.name}</h4>
              <p className="text-sm text-cream/60">
                from{' '}
                <span className="font-medium tabular-nums text-gold">
                  {formatPKR(service.basePrice)}
                </span>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedProducts() {
  const { data } = useQuery({
    queryKey: ['products', { category: undefined, search: '' }],
    queryFn: () => fetchProducts({}),
  })
  if (!data || data.items.length === 0) return null
  return (
    <section className="py-16" aria-labelledby="featured-heading">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-wine mb-3">The wardrobe</p>
          <h3 id="featured-heading" className="font-display text-4xl text-primary">
            From the collection
          </h3>
        </div>
        <Link to="/products" className="text-sm text-accent hover:underline whitespace-nowrap">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {data.items.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

function CraftBand() {
  return (
    <section className="my-16 rounded-2xl bg-wine text-cream px-8 sm:px-14 py-14 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 10px, #F7F1E5 10px, #F7F1E5 11px)',
        }}
      />
      <div className="relative max-w-2xl">
        <div className="w-10 h-0.5 bg-gold mb-6" />
        <p className="font-display text-3xl sm:text-4xl leading-snug italic mb-6">
          Machines cut fast. Hands cut true. Every Darzi order is measured twice and stitched
          once — for you, not a mannequin.
        </p>
        <Link
          to="/custom"
          className="inline-block px-7 py-3 bg-gold text-ink font-medium rounded-lg transition-colors duration-200 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream"
        >
          Get measured
        </Link>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <div>
      <Hero />
      <HowItWorks />
      <FeaturedProducts />
      <ServicesStrip />
      <CraftBand />
    </div>
  )
}
