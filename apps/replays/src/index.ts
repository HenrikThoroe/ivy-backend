import express from 'express'
import cors from 'cors'
import { router } from './router'
import { worker } from './mq'

const app = express()

worker.run()
app.use(cors())
app.use('/replays', router)

app.listen(process.env.REPLAYS_PORT)
