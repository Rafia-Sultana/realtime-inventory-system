import { Request, Response } from 'express'
import { Reservation, Purchase, User } from '../models'
import { sequelize } from '../config/database'
import { emitStockUpdate, emitBuyersUpdate } from '../sockets'


export async function completePurchase(req: Request, res: Response) {
  try {
    const reservationId = Number(req.params.id)
    const { userId } = req.body

    if (!Number.isInteger(reservationId) || !userId) {
      res.status(400).json({ error: 'Valid reservation id and userId are required' })
      return
    }

    const t = await sequelize.transaction()

    const reservation = await Reservation.findOne({
      where: { id: reservationId, userId },
      transaction: t,
    })

    if (!reservation) {
      await t.rollback()
      res.status(404).json({ error: 'Reservation not found for this user' })
      return
    }

    if (reservation.status !== 'active' || reservation.expiresAt < new Date()) {
      await t.rollback()
      res.status(409).json({ error: 'Reservation is expired' })
      return
    }

    await Purchase.create(
      {
        dropId: reservation.dropId,
        userId: reservation.userId,
        reservationId: reservation.id,
      },
      { transaction: t }
    )

    await reservation.update({ status: 'completed' }, { transaction: t })

    await t.commit()
    const buyers = await Purchase.findAll({
      where: { dropId: reservation.dropId },
      order: [['createdAt', 'DESC']],
      limit: 3,
      include: [{ model: User }],
    })

    emitBuyersUpdate(
      reservation.dropId,
     buyers.map((b) => {
  const buyer = b as Purchase & { user: User }
  return { username: buyer.user.username, createdAt: buyer.createdAt }
})
    )


    res.json({ message: 'Purchase completed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to complete purchase' })
  }
}
