import { Op } from 'sequelize'
import {  Reservation, Drop } from '../models'
import { sequelize } from '../config/database'
import { emitStockUpdate } from '../sockets'

const SWEEP_INTERVAL_MS = 10_000

async function expireReservations() {
  const t = await sequelize.transaction()

  try {
    const updatedDropIds = new Set<number>()

    const expired = await Reservation.findAll({
      where: {
        status: 'active',
        expiresAt: { [Op.lt]: new Date() },
      },
      transaction: t,
    })


    for (const reservation of expired) {
      const [won] = await Reservation.update(
        { status: 'expired' },
        { where: { id: reservation.id, status: 'active' }, transaction: t }
      )

      if (won === 0) continue

      await Drop.update(
        { availableStock: sequelize.literal('"availableStock" + 1') },
        { where: { id: reservation.dropId }, transaction: t }
      )

      updatedDropIds.add(reservation.dropId)
    }

    await t.commit()
    for (const dropId of updatedDropIds) {
      const drop = await Drop.findByPk(dropId)
      if (drop) {
        emitStockUpdate(drop.id, drop.availableStock)
      }
    }

    if (expired.length > 0) {
      console.log(`Expired ${expired.length} reservations`)
    }
  } catch (err) {
    await t.rollback()
    console.error('Expiry sweep failed:', err)
  }
}

export function startExpirySweeper() {
  setInterval(() => {
    expireReservations().catch((err) => console.error(err))
  }, SWEEP_INTERVAL_MS)
}
