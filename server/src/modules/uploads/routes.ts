import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { uploadImage } from './service.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
})

const router = Router()

router.use(requireAuth, requireAdmin)

router.post('/product', upload.single('image'), async (req, res, next) => {
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

export default router
