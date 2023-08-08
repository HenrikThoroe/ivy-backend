import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { loadenv } from 'env-util'
import { verificationGroupRouter } from './router/api.router'
import { replayWorker } from './services/messaging.service'

loadenv()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use('/verification', verificationGroupRouter)
app.listen(process.env.STATS_PORT)
replayWorker.run()
