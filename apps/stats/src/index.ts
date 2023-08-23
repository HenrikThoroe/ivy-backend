import cors from 'cors'
import { loadenv } from 'env-util'
import express from 'express'
import helmet from 'helmet'
import { setupMessageQueue } from './api/messages'
import { verificationRouter } from './api/router'

loadenv()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
verificationRouter.mount(app)
app.listen(process.env.STATS_PORT)

setupMessageQueue()
