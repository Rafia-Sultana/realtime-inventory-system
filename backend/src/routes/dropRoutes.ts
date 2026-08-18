import { Router } from 'express'
import { createDrop, getDrops } from '../controllers/dropController'
import { reserveDrop } from '../controllers/reservationController'



const router = Router()


router.post('/', createDrop);
router.get('/', getDrops);

router.post('/:id/reserve', reserveDrop)


export default router
