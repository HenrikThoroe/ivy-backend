import cors from 'cors'
import express from 'express'
import { HTTPLogger } from 'metrics'
import { setupMessageQueue } from './api/messages'
import { replayRouter } from './api/router'

const app = express()
const logger = new HTTPLogger('Replay')

setupMessageQueue()

app.use(cors())
replayRouter.mount(app, logger)
app.listen(process.env.REPLAYS_PORT)
