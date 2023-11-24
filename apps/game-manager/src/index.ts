import { AuthFactory } from 'auth'
import { loadenv } from 'env-util'
import express from 'express'
import helmet from 'helmet'
import { HTTPLogger, WSSLogger } from 'metrics'
import { gameRouter } from './api/game.router'
import { playerSocket } from './api/game.ws'

loadenv()

const app = express()
const factory = process.env.NODE_ENV === 'test' ? AuthFactory.local : AuthFactory.supabase
const { handler } = factory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
  secret: process.env.JWT_SECRET!,
  issuer: process.env.JWT_ISSUER!,
})

const logger = {
  games: new HTTPLogger('Games'),
  clients: new WSSLogger('Clients'),
}

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
gameRouter.mount(app, logger.games, handler)
playerSocket.use(logger.clients)
playerSocket.listen(process.env.GM_WSS_PORT!)
app.listen(process.env.GM_PORT)
