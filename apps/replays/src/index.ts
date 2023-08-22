import cors from 'cors'
import express from 'express'
import { setupMessageQueue } from './api/messages'
import { replayRouter } from './api/router'

const app = express()

setupMessageQueue()

app.use(cors())
replayRouter.mount(app)
app.listen(process.env.REPLAYS_PORT)
