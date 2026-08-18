import { Request, Response } from 'express'
import { Drop, Purchase, User } from '../models'
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';

export async function getDrops(_req: Request, res: Response) {
  try {
    const drops = await Drop.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']],
    })

    const dropIds = drops.map((d) => d.id)

    const buyers = await sequelize.query(
      `SELECT p."dropId", u.username, p."createdAt"
       FROM purchases p
       JOIN users u ON u.id = p."userId"
       WHERE p."dropId" IN (:dropIds)
       ORDER BY p."createdAt" DESC`,
      {
        replacements: { dropIds },
        type: QueryTypes.SELECT,
      }
    ) as { dropId: number; username: string; createdAt: Date }[]

    const result = drops.map((drop) => ({
      ...drop.toJSON(),
      recentBuyers: buyers.filter((b) => b.dropId === drop.id).slice(0, 3),
    }))

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch drops' })
  }
}
export async function createDrop(req: Request, res: Response) {
  try {
    const { name, price, totalStock, startsAt } = req.body

    if (!name || price === undefined || totalStock === undefined || !startsAt) {
      res.status(400).json({ error: 'name, price, totalStock and startsAt are required' })
      return
    }

    const drop = await Drop.create({
      name,
      price,
      totalStock,
      availableStock: totalStock,
      startsAt,
    })

    res.status(201).json(drop)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create drop' })
  }
}
