import { AuthFactory } from 'auth'
import cors from 'cors'
import { loadenv } from 'env-util'
import express from 'express'
import { HTTPLogger } from 'metrics'
import { setupMessageQueue } from './api/messages'
import { replayRouter } from './api/router'

loadenv()

const app = express()
const logger = new HTTPLogger('Replay')
const factory = process.env.NODE_ENV === 'test' ? AuthFactory.local : AuthFactory.supabase
const { handler } = factory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
  secret: process.env.JWT_SECRET!,
  issuer: process.env.JWT_ISSUER!,
})

setupMessageQueue()

app.use(cors())
replayRouter.mount(app, logger, handler)
app.listen(process.env.REPLAYS_PORT)
