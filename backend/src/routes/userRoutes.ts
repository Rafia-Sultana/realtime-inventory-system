import { Router } from 'express'
import { User } from '../models'

const router = Router()

router.get('/:id', async (req, res) => {
  const user = await User.findByPk(Number(req.params.id))
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ id: user.id, username: user.username })
})

export default router
