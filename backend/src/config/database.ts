import { Sequelize } from 'sequelize'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is not set in .env')
}

export const sequelize = new Sequelize(url, {
  logging: false,
})

export async function connectDB(): Promise<void> {
  await sequelize.authenticate()
  console.log('Database connected')
}
