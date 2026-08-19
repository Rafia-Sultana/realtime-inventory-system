import { Request, Response } from 'express'
import { Reservation, Purchase, User } from '../models'
import { sequelize } from '../config/database'
import { emitStockUpdate, emitBuyersUpdate } from '../sockets'
import { QueryTypes, Transaction } from 'sequelize'


export async function completePurchase(req: Request, res: Response) {
    let t: Transaction | null = null

  try {
    const reservationId = Number(req.params.id)
    const { userId } = req.body

    if (!Number.isInteger(reservationId) || !userId) {
      res.status(400).json({ error: 'Valid reservation id and userId are required' })
      return
    }

     t = await sequelize.transaction()

    const reservation = await Reservation.findOne({
      where: { id: reservationId, userId },
      transaction: t,
     lock: t.LOCK.UPDATE,

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

    const buyers = (await sequelize.query(
          `SELECT DISTINCT ON (u.username) u.username, p."createdAt"
       FROM purchases p
       JOIN users u ON u.id = p."userId"
       WHERE p."dropId" = :dropId
       ORDER BY u.username, p."createdAt" DESC
       LIMIT 10`
,
      {
        replacements: { dropId: reservation.dropId },
        type: QueryTypes.SELECT,
      }
    )) as { username: string; createdAt: Date }[]

      const recent = buyers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((b) => ({ username: b.username, createdAt: b.createdAt }))

    emitBuyersUpdate(reservation.dropId, recent)




    res.json({ message: 'Purchase completed' })
  } catch (err) {
    if (t && !(t as Transaction & { finished?: string }).finished) {
      await t.rollback()
    }
    console.error(err)
    res.status(500).json({ error: 'Failed to complete purchase' })
  }

}
