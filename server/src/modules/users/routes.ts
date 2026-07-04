import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { getAuthAdmin } from '../../config/firebase.js'
import { updateMeSchema } from './schemas.js'
import { getOrCreateUser, updateUser } from './service.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const user = req.user!
    // token name claim needs a lookup only on first create; verifyIdToken result
    // does not always carry `name`, so read it from the auth record lazily
    let name: string | undefined
    const record = await getAuthAdmin()
      .getUser(user.uid)
      .catch(() => null)
    if (record?.displayName) name = record.displayName
    const profile = await getOrCreateUser({ uid: user.uid, email: user.email, name })
    res.json({ profile, isAdmin: user.isAdmin })
  } catch (err) {
    next(err)
  }
})

router.patch('/', async (req, res, next) => {
  try {
    const parsed = updateMeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: 'Invalid input', details: parsed.error.flatten() },
      })
      return
    }
    const profile = await updateUser(req.user!.uid, parsed.data)
    res.json({ profile, isAdmin: req.user!.isAdmin })
  } catch (err) {
    next(err)
  }
})

export default router
