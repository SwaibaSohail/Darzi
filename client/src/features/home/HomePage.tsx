import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { customApi } from '../custom/api'
import { fetchProducts } from '../catalog/api'
import { ProductCard } from '../catalog/ProductCard'
import { formatPKR } from '../../lib/money'

function Hero() {
  return (
    <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center pt-6 pb-20">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-accent mb-5">
          Bespoke tailoring · Est. by hand
        </p>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-primary leading-[1.05] mb-6">
          Tailored to you.
          <span className="block italic font-medium text-accent mt-1">Stitch by stitch.</span>
        </h2>
        <p className="text-lg text-secondary mb-9 max-w-md leading-relaxed">
          Ready-made garments, fine fabrics, and custom stitching cut to your exact
          measurements — with your tailor one message away.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/products"
            className="inline-block px-8 py-3.5 bg-primary text-white rounded-lg shadow-sm transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Browse the Collection
          </Link>
          <Link
            to="/custom"
            className="inline-block px-8 py-3.5 border border-border bg-surface text-primary rounded-lg transition-colors duration-200 cursor-pointer hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Start Custom Stitching
          </Link>
        </div>
      </div>

      <div className="hidden lg:block relative h-105" aria-hidden="true">
        <div className="absolute top-0 right-8 w-56 h-72 bg-primary rounded-2xl rotate-3" />
        <div className="absolute top-10 right-32 w-56 h-72 bg-accent-soft border border-border rounded-2xl -rotate-3" />
        <div className="absolute top-20 right-16 w-56 h-72 bg-surface border border-border rounded-2xl rotate-1 shadow-lg p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-0.5 bg-accent mb-4" />
            <p className="font-display text-2xl text-primary leading-snug">
              "The fit makes
              <br />
              the man."
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 rounded-full bg-muted" />
            <div className="h-1.5 rounded-full bg-muted w-4/5" />
            <div className="h-1.5 rounded-full bg-muted w-3/5" />
          </div>
        </div>
        <svg
          className="absolute -bottom-2 left-4 text-accent/70"
          width="180"
          height="60"
          viewBox="0 0 180 60"
          fill="none"
        >
          <path
            d="M4 50 C 40 10, 80 55, 120 25 S 176 20, 176 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
        </svg>
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
    <section className="py-16 border-t border-border" aria-labelledby="how-heading">
      <h3 id="how-heading" className="font-display text-3xl text-primary mb-12">
        How it works
      </h3>
      <div className="grid sm:grid-cols-3 gap-10">
        {STEPS.map((step) => (
          <div key={step.n}>
            <p className="font-display text-5xl text-accent/40 mb-3">{step.n}</p>
            <div className="w-8 h-0.5 bg-accent mb-4" />
            <h4 className="font-medium text-primary mb-2">{step.title}</h4>
            <p className="text-sm text-secondary leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ServicesStrip() {
  const { data } = useQuery({ queryKey: ['services'], queryFn: customApi.listServices })
  if (!data || data.items.length === 0) return null
  return (
    <section className="py-16 border-t border-border" aria-labelledby="services-heading">
      <div className="flex items-end justify-between mb-10">
        <h3 id="services-heading" className="font-display text-3xl text-primary">
          Custom stitching
        </h3>
        <Link to="/custom" className="text-sm text-accent hover:underline">
          Start an order →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.items.map((service) => (
          <Link
            key={service.id}
            to="/custom"
            className="group border border-border rounded-xl bg-surface p-5 transition-all duration-200 hover:shadow-md hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="w-6 h-0.5 bg-accent mb-4 transition-all duration-300 group-hover:w-10" />
            <h4 className="font-display text-xl text-primary mb-1">{service.name}</h4>
            <p className="text-sm text-secondary">
              from <span className="text-primary font-medium tabular-nums">{formatPKR(service.basePrice)}</span>
            </p>
          </Link>
        ))}
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
    <section className="py-16 border-t border-border" aria-labelledby="featured-heading">
      <div className="flex items-end justify-between mb-10">
        <h3 id="featured-heading" className="font-display text-3xl text-primary">
          From the collection
        </h3>
        <Link to="/products" className="text-sm text-accent hover:underline">
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
    <section className="my-16 rounded-2xl bg-primary text-white px-8 sm:px-14 py-14 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 11px)',
        }}
      />
      <div className="relative max-w-2xl">
        <div className="w-10 h-0.5 bg-accent mb-6" />
        <p className="font-display text-3xl sm:text-4xl leading-snug italic mb-6">
          Machines cut fast. Hands cut true. Every Darzi order is measured twice and stitched
          once — for you, not a mannequin.
        </p>
        <Link
          to="/custom"
          className="inline-block px-7 py-3 bg-accent text-white rounded-lg transition-colors duration-200 hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
