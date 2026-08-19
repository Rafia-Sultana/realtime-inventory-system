import 'dotenv/config'
import './models'
import express from 'express'
import cors from 'cors'
import { connectDB, sequelize } from './config/database'
import dropRoutes from './routes/dropRoutes'
import reservationRoutes from './routes/reservationRoutes'
import { startExpirySweeper } from './services/expiryService'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { initSocket } from './sockets'




const app = express()
const PORT = process.env.PORT ?? 4000

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

app.use(cors())
app.use(express.json())


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use('/api/drops', dropRoutes)
app.use('/api/reservations', reservationRoutes)
initSocket(io)

connectDB().then(async () => {
  await sequelize.sync()
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    startExpirySweeper()

  })
})


