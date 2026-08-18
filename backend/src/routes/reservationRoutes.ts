import { Router } from 'express'
import { completePurchase } from '../controllers/purchaseController'

const router = Router()

router.post('/:id/purchase', completePurchase)

export default router
