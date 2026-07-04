import { Router } from 'express'
import { listServices, getService } from './service.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    res.json({ items: await listServices() })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const service = await getService(req.params.id)
    if (!service) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Service not found' } })
      return
    }
    res.json({ service })
  } catch (err) {
    next(err)
  }
})

export default router
