import { Router } from 'express'
import multer from 'multer'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { uploadImage } from './service.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
})

/** Admin-only product image uploads. */
export const adminUploadsRouter = Router()
adminUploadsRouter.use(requireAuth, requireAdmin)

adminUploadsRouter.post('/product', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'No image file provided' } })
      return
    }
    const image = await uploadImage(req.file.buffer, 'darzi/products')
    res.status(201).json({ image })
  } catch (err) {
    next(err)
  }
})

// Reference sketches for custom orders — any signed-in user, but not often.
const referenceLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // uid when authenticated; IPv6-safe ip bucketing otherwise
  keyGenerator: (req) => req.user?.uid ?? (req.ip ? ipKeyGenerator(req.ip) : 'anonymous'),
})

/** Authenticated customer uploads, namespaced per user. */
export const userUploadsRouter = Router()
userUploadsRouter.use(requireAuth)

userUploadsRouter.post('/reference', referenceLimit, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'No image file provided' } })
      return
    }
    // The per-user folder is what the order flow later verifies ownership against.
    const image = await uploadImage(req.file.buffer, `darzi/references/${req.user!.uid}`)
    res.status(201).json({ image })
  } catch (err) {
    next(err)
  }
})
