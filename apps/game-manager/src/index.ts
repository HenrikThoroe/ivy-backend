import express from 'express'
import helmet from 'helmet'
import { HTTPLogger, WSSLogger } from 'metrics'
import { gameRouter } from './api/game.router'
import { gameSocket } from './api/game.ws'

const app = express()
const logger = {
  games: new HTTPLogger('Games'),
  clients: new WSSLogger('Clients'),
}

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
gameRouter.mount(app, logger.games)
gameSocket.use(logger.clients)
gameSocket.listen(process.env.GM_WSS_PORT!)
app.listen(process.env.GM_PORT)
