import { loadenv } from 'env-util'

loadenv()

import express from 'express'
import helmet from 'helmet'
import { gameServer } from './gameServer'
import { managementRouter } from './router/manage.routes'
const app = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/games', managementRouter)
app.listen(process.env.GM_PORT)
gameServer.listen(parseInt(process.env.GM_WSS_PORT!))
