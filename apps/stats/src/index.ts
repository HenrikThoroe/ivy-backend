import { AuthFactory } from 'auth'
import cors from 'cors'
import { loadenv } from 'env-util'
import express from 'express'
import helmet from 'helmet'
import { HTTPLogger } from 'metrics'
import { setupMessageQueue } from './api/messages'
import { verificationRouter } from './api/router'

loadenv()

const app = express()
const logger = new HTTPLogger('Verification')
const { handler } = AuthFactory.supabase({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
  secret: process.env.JWT_SECRET!,
  issuer: process.env.JWT_ISSUER!,
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
verificationRouter.mount(app, logger, handler)
app.listen(process.env.STATS_PORT)

setupMessageQueue()
