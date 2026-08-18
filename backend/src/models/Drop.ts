import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

interface DropAttributes {
  id: number
  name: string
  price: number
  totalStock: number
  availableStock: number
  startsAt: Date
  status: string
  createdAt: Date
  updatedAt: Date
}

interface DropCreationAttributes extends Optional<DropAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {}

export class Drop extends Model<DropAttributes, DropCreationAttributes> implements DropAttributes {
  declare id: number
  declare name: string
  declare price: number
  declare totalStock: number
  declare availableStock: number
  declare startsAt: Date
  declare status: string
  declare createdAt: Date
  declare updatedAt: Date

}

Drop.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    totalStock: { type: DataTypes.INTEGER, allowNull: false },
    availableStock: { type: DataTypes.INTEGER, allowNull: false },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },

  },
  {
    sequelize,
    tableName: 'drops',
  }
)
