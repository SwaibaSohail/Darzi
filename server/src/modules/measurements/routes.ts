import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { measurementProfileSchema } from './schemas.js'
import { listProfiles, createProfile, updateProfile, deleteProfile } from './service.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    res.json({ items: await listProfiles(req.user!.uid) })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const parsed = measurementProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: 'Invalid input', details: parsed.error.flatten() },
      })
      return
    }
    const profile = await createProfile(req.user!.uid, parsed.data)
    res.status(201).json({ profile })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = measurementProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: 'Invalid input', details: parsed.error.flatten() },
      })
      return
    }
    const profile = await updateProfile(req.user!.uid, req.params.id, parsed.data)
    if (!profile) {
      // foreign and missing profiles look identical — never confirm existence
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } })
      return
    }
    res.json({ profile })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await deleteProfile(req.user!.uid, req.params.id)
    if (!ok) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } })
      return
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
