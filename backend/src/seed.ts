import 'dotenv/config'
import { sequelize, connectDB } from './config/database'
import './models'
import { User, Drop } from './models'

async function seed() {
  await connectDB()

  const users = await User.bulkCreate([
    { username: 'rafi' },
    { username: 'tamim' },
    { username: 'sadman' },
    { username: 'nipa' },
    { username: 'rakib' },
  ])

  await Drop.bulkCreate([
    { name: 'Air Jordan 1 Chicago', price: 25000, totalStock: 100, availableStock: 100, startsAt: new Date() },
    { name: 'Yeezy Boost 350', price: 32000, totalStock: 50, availableStock: 50, startsAt: new Date() },
    { name: 'Nike Dunk Low Panda', price: 15000, totalStock: 200, availableStock: 200, startsAt: new Date() },
  ])

  console.log(`Seeded ${users.length} users and 3 drops`)
  await sequelize.close()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
