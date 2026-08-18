import { User } from './User'
import { Drop } from './drop'
import { Reservation } from './Reservation'
import { Purchase } from './Purchase'

User.hasMany(Reservation, { foreignKey: 'userId' })
Reservation.belongsTo(User, { foreignKey: 'userId' })

Drop.hasMany(Reservation, { foreignKey: 'dropId' })
Reservation.belongsTo(Drop, { foreignKey: 'dropId' })

User.hasMany(Purchase, { foreignKey: 'userId' })
Purchase.belongsTo(User, { foreignKey: 'userId' })

Drop.hasMany(Purchase, { foreignKey: 'dropId' })
Purchase.belongsTo(Drop, { foreignKey: 'dropId' })

Purchase.belongsTo(Reservation, { foreignKey: 'reservationId' })
Reservation.hasOne(Purchase, { foreignKey: 'reservationId' })

export { User, Drop, Reservation, Purchase }
