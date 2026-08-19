import { Op } from 'sequelize'
import { Request, Response } from 'express'
import { Drop, Reservation } from '../models'
import { emitStockUpdate } from '../sockets'


const RESERVATION_WINDOW_MS = 60_000

export async function reserveDrop(req: Request, res: Response) {
  try {
    const dropId = Number(req.params.id)
    const { userId } = req.body

    if (!Number.isInteger(dropId) || !userId) {
      res.status(400).json({ error: 'Valid drop id and userId are required' })
      return
    }

    const drop = await Drop.findByPk(dropId)
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' })
      return
    }
    if (drop.status !== 'active' || drop.startsAt > new Date()) {
      res.status(400).json({ error: 'This drop is not active yet' })
      return
    }

    const [affectedRows] = await Drop.update(
{ availableStock: Drop.sequelize!.literal('"availableStock" - 1') },

      { where: { id: dropId, availableStock: { [Op.gt]: 0 } } }
    )

    if (affectedRows === 0) {
      res.status(409).json({ error: 'Sold out' })
      return
    }

    const reservation = await Reservation.create({
      dropId,
      userId,
      status: 'active',
      expiresAt: new Date(Date.now() + RESERVATION_WINDOW_MS),
    })

    emitStockUpdate(dropId, drop.availableStock - 1)

    res.status(201).json({
      message: 'Reserved for 60 seconds',
      reservation,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to reserve' })
  }
}

export async function cancelReservation(req: Request, res: Response) {
  try {
    const reservationId = Number(req.params.id)
    const { userId } = req.body

    if (!Number.isInteger(reservationId) || !userId) {
      res.status(400).json({ error: 'Valid reservation id and userId are required' })
      return
    }

    const [affectedRows] = await Reservation.update(
      { status: 'cancelled' },
      { where: { id: reservationId, userId, status: 'active' } }
    )

    if (affectedRows === 0) {
      res.status(409).json({ error: 'Reservation is not active' })
      return
    }

    const reservation = await Reservation.findByPk(reservationId)

    await Drop.update(
      { availableStock: Drop.sequelize!.literal('"availableStock" + 1') },
      { where: { id: reservation!.dropId } }
    )

    const drop = await Drop.findByPk(reservation!.dropId)

    emitStockUpdate(drop!.id, drop!.availableStock)

    res.json({ message: 'Reservation cancelled' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to cancel reservation' })
  }
}
