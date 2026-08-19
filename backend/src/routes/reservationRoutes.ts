import { Router } from 'express'
import { completePurchase } from '../controllers/purchaseController'
import { cancelReservation } from '../controllers/reservationController'

const router = Router()

router.post('/:id/purchase', completePurchase)
router.post('/:id/cancel', cancelReservation)


export default router
