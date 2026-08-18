import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

interface ReservationAttributes {
    id: number
    dropId: number
    userId: number
    status: 'active' | 'completed' | 'expired'
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
}

interface ReservationCreationAttributes extends Optional<ReservationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> { }

export class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
    declare id: number
    declare dropId: number
    declare userId: number
    declare status: 'active' | 'completed' | 'expired'
    declare expiresAt: Date
    declare createdAt: Date
    declare updatedAt: Date

}

Reservation.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        dropId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        status: { type: DataTypes.ENUM('active','completed','expired'), allowNull: false, defaultValue: "active" },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },

    },
    {
        sequelize,
        tableName: 'reservations',
    }
)
