import express from 'express'
import cors from 'cors'
import { router } from './router'
import { logWorker, replayWorker } from './mq'

const app = express()

replayWorker.run()
logWorker.run()
app.use(cors())
app.use('/replays', router)

app.listen(process.env.REPLAYS_PORT)
