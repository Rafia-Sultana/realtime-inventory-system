import { Request, Response } from 'express'
import { Reservation, Purchase, User } from '../models'
import { sequelize } from '../config/database'
import { emitStockUpdate, emitBuyersUpdate } from '../sockets'
import { QueryTypes } from 'sequelize'

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

    
    // const buyers = await Purchase.findAll({
    //   where: { dropId: reservation.dropId },
    //   order: [['createdAt', 'DESC']],
    //   limit: 3,
    //   include: [{ model: User, required:true }],
    // })

//     emitBuyersUpdate(
//       reservation.dropId,
      
//      buyers.map((b) => {
//   const buyer = b as Purchase & { user: User }
//   return { username: buyer.user.username, createdAt: buyer.createdAt }
// })
//     )
    await t.commit()

    const buyers = (await sequelize.query(
      `SELECT u.username, p."createdAt"
       FROM purchases p
       JOIN users u ON u.id = p."userId"
       WHERE p."dropId" = :dropId
       ORDER BY p."createdAt" DESC
       LIMIT 3`,
      {
        replacements: { dropId: reservation.dropId },
        type: QueryTypes.SELECT,
      }
    )) as { username: string; createdAt: Date }[]

    emitBuyersUpdate(reservation.dropId, buyers)



    res.json({ message: 'Purchase completed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to complete purchase' })
  }
}
