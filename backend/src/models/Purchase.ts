import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

interface PurchaseAttributes {
    id: number
    dropId: number
    userId: number
    reservationId: number
    createdAt: Date
    updatedAt: Date
}
interface PurchaseCreationAttributes extends Optional<PurchaseAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export class Purchase extends Model<PurchaseAttributes, PurchaseCreationAttributes> implements PurchaseAttributes {
    declare id: number
    declare dropId: number
    declare userId: number
    declare reservationId: number
    declare createdAt: Date
    declare updatedAt: Date
}
Purchase.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        dropId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        reservationId: { type: DataTypes.INTEGER, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },

    },
    {
        sequelize,
        tableName: 'purchases',
    }
)
