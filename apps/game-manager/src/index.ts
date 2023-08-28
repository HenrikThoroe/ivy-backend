import express from 'express'
import helmet from 'helmet'
import { gameRouter } from './api/game.router'
import { gameSocket } from './api/game.ws'

const app = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
gameRouter.mount(app)
gameSocket.listen(process.env.GM_WSS_PORT!)
app.listen(process.env.GM_PORT)
