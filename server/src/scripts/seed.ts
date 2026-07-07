/**
 * Seeds the catalog: 12 products (ready-made + fabric) and 4 stitching services.
 * Skips if products already exist unless --force is passed:
 *   npx tsx src/scripts/seed.ts [--force]
 * Prices are integer paisa (PKR minor unit, x100).
 */
import { getDb, serverTimestamp } from '../config/firebase.js'

// Curated real garment/textile photos (Unsplash CDN, hotlink-permitted, sized
// to a 4:5 crop). Swap any of these for your own shots via the admin panel.
const PHOTOS = {
  kurta: '1744208525808-66c60e0ea68c', // man in a light blue kurta
  shirt: '1486589089611-394385ff1a68', // man in a crisp white shirt
  suit: '1592343516109-362f7bd871aa', // tailored jacket on a hanger
  sherwani: '1576470189712-50fe3ec06b04', // ornate sherwani
  textile: '1572206443494-b07cc12d6921', // stack of folded textiles
  folded: '1635274605638-d44babc08a4f', // folded cloth bundles
} as const

const img = (key: keyof typeof PHOTOS) => ({
  url: `https://images.unsplash.com/photo-${PHOTOS[key]}?w=800&h=1000&fit=crop&q=80&auto=format`,
  path: null,
})

const products = [
  // ready-made
  { name: 'Classic White Kameez Shalwar', description: 'Crisp white cotton kameez shalwar, everyday elegance with a tailored collar.', category: 'ready-made', subcategory: 'kameez', price: 450000, sizes: ['S', 'M', 'L', 'XL'], images: [img('shirt')], stock: 20 },
  { name: 'Charcoal Kurta', description: 'Soft charcoal kurta in breathable blended fabric, ban collar, concealed placket.', category: 'ready-made', subcategory: 'kurta', price: 380000, sizes: ['S', 'M', 'L', 'XL'], images: [img('kurta')], stock: 25 },
  { name: 'Navy Waistcoat Set', description: 'Kameez shalwar with matching navy waistcoat — wedding-guest ready.', category: 'ready-made', subcategory: 'waistcoat', price: 650000, sizes: ['S', 'M', 'L', 'XL'], images: [img('suit')], stock: 12 },
  { name: 'Embroidered Eid Kameez', description: 'Hand-finished embroidery on the collar and cuffs, festive off-white tone.', category: 'ready-made', subcategory: 'kameez', price: 720000, sizes: ['M', 'L', 'XL'], images: [img('sherwani')], stock: 10 },
  { name: 'Slim-Fit Cotton Trousers', description: 'Tapered cotton trousers with clean hems, pairs with kurtas and shirts alike.', category: 'ready-made', subcategory: 'trousers', price: 280000, sizes: ['S', 'M', 'L', 'XL'], images: [img('suit')], stock: 18 },
  { name: 'Casual Linen Kurta', description: 'Relaxed linen kurta for summer — light, airy, and unfussy.', category: 'ready-made', subcategory: 'kurta', price: 420000, sizes: ['S', 'M', 'L'], images: [img('kurta')], stock: 15 },
  { name: 'Formal Black Sherwani', description: 'Ready-to-wear sherwani in structured black, antique buttons included.', category: 'ready-made', subcategory: 'sherwani', price: 1500000, sizes: ['M', 'L'], images: [img('sherwani')], stock: 4 },
  // fabric
  { name: 'Premium Cotton — 5m bundle', description: 'Fine-count premium cotton, enough for a full kameez shalwar.', category: 'fabric', subcategory: 'cotton', price: 350000, sizes: [], images: [img('textile')], stock: 30 },
  { name: 'Irish Linen — 5m bundle', description: 'Imported Irish linen with a dry, cool handle. Summer favourite.', category: 'fabric', subcategory: 'linen', price: 580000, sizes: [], images: [img('folded')], stock: 14 },
  { name: 'Winter Khaddar — 5m bundle', description: 'Warm handloom khaddar in earthy tones for the cold season.', category: 'fabric', subcategory: 'khaddar', price: 320000, sizes: [], images: [img('textile')], stock: 22 },
  { name: 'Soft Wash-n-Wear — 5m bundle', description: 'Low-maintenance wash-n-wear, holds its press through long days.', category: 'fabric', subcategory: 'wash-n-wear', price: 300000, sizes: [], images: [img('folded')], stock: 28 },
  { name: 'Raw Silk — 5m bundle', description: 'Lustrous raw silk for sherwanis and formal kameez.', category: 'fabric', subcategory: 'silk', price: 850000, sizes: [], images: [img('textile')], stock: 8 },
]

const services = [
  {
    name: 'Shalwar Kameez Stitching',
    description: 'Classic kameez shalwar stitched to your measurements. Bring your own fabric or pick one of ours.',
    basePrice: 250000,
    options: [
      { key: 'collar', label: 'Collar style', choices: [
        { value: 'ban', label: 'Ban collar', priceDelta: 0 },
        { value: 'classic', label: 'Classic collar', priceDelta: 0 },
        { value: 'round', label: 'Round neck', priceDelta: 5000 },
      ] },
      { key: 'cuff', label: 'Cuff style', choices: [
        { value: 'plain', label: 'Plain cuff', priceDelta: 0 },
        { value: 'button', label: 'Button cuff', priceDelta: 10000 },
      ] },
      { key: 'fit', label: 'Fit', choices: [
        { value: 'regular', label: 'Regular fit', priceDelta: 0 },
        { value: 'slim', label: 'Slim fit', priceDelta: 0 },
      ] },
    ],
    measurementFields: ['neck', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'shirtLength', 'trouserLength'],
    image: img('kurta'),
  },
  {
    name: 'Trousers Stitching',
    description: 'Dress or casual trousers with clean finishing and your preferred break.',
    basePrice: 120000,
    options: [
      { key: 'waist', label: 'Waistband', choices: [
        { value: 'regular', label: 'Regular', priceDelta: 0 },
        { value: 'adjustable', label: 'Adjustable', priceDelta: 8000 },
      ] },
      { key: 'hem', label: 'Hem', choices: [
        { value: 'plain', label: 'Plain', priceDelta: 0 },
        { value: 'cuffed', label: 'Cuffed', priceDelta: 5000 },
      ] },
    ],
    measurementFields: ['waist', 'hip', 'inseam', 'thigh', 'trouserLength'],
    image: img('suit'),
  },
  {
    name: 'Two-Piece Suit',
    description: 'Jacket and trousers cut to measure — canvassed front, working details on request.',
    basePrice: 1200000,
    options: [
      { key: 'lapel', label: 'Lapel', choices: [
        { value: 'notch', label: 'Notch lapel', priceDelta: 0 },
        { value: 'peak', label: 'Peak lapel', priceDelta: 20000 },
      ] },
      { key: 'vents', label: 'Vents', choices: [
        { value: 'single', label: 'Single vent', priceDelta: 0 },
        { value: 'double', label: 'Double vent', priceDelta: 15000 },
      ] },
      { key: 'lining', label: 'Lining', choices: [
        { value: 'standard', label: 'Standard', priceDelta: 0 },
        { value: 'premium', label: 'Premium', priceDelta: 50000 },
      ] },
    ],
    measurementFields: ['neck', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'shirtLength', 'trouserLength', 'inseam', 'thigh'],
    image: img('suit'),
  },
  {
    name: 'Sherwani',
    description: 'Occasion sherwani with structured shoulders and hand-set closures.',
    basePrice: 1800000,
    options: [
      { key: 'buttons', label: 'Buttons', choices: [
        { value: 'classic', label: 'Classic', priceDelta: 0 },
        { value: 'antique', label: 'Antique metal', priceDelta: 25000 },
      ] },
      { key: 'inner', label: 'Inner lining', choices: [
        { value: 'standard', label: 'Standard', priceDelta: 0 },
        { value: 'silk', label: 'Silk', priceDelta: 80000 },
      ] },
    ],
    measurementFields: ['neck', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'shirtLength'],
    image: img('sherwani'),
  },
]

const db = getDb()
const force = process.argv.includes('--force')

const existing = await db.collection('products').limit(1).get()
if (!existing.empty && !force) {
  console.log('Products already exist — pass --force to reseed anyway.')
  process.exit(0)
}

// On reseed, remove existing catalog docs first so we replace rather than
// duplicate. Placed orders keep their own snapshots, so this is safe.
async function clearCollection(name: string): Promise<void> {
  const snap = await db.collection(name).get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
  console.log(`Cleared ${snap.size} existing ${name}.`)
}

if (force) {
  await clearCollection('products')
  await clearCollection('services')
}

const batch = db.batch()
for (const p of products) {
  batch.set(db.collection('products').doc(), {
    ...p,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
for (const s of services) {
  batch.set(db.collection('services').doc(), {
    ...s,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
await batch.commit()
console.log(`Seeded ${products.length} products and ${services.length} services.`)
