import { AuthFactory } from 'auth'
import cors from 'cors'
import { loadenv } from 'env-util'
import express from 'express'
import helmet from 'helmet'
import { HTTPLogger, WSSLogger } from 'metrics'
import { driverRouter } from './api/driver.router'
import { driverSocket } from './api/driver.ws'
import { sessionRouter } from './api/session.router'
import { suiteRouter } from './api/suite.router'

const app = express()

const { handler } = AuthFactory.supabase({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
  secret: process.env.JWT_SECRET!,
  issuer: process.env.JWT_ISSUER!,
})

const logger = {
  driver: new HTTPLogger('Driver'),
  session: new HTTPLogger('Sessions'),
  suite: new HTTPLogger('Suites'),
  clients: new WSSLogger('Clients'),
}

loadenv()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
driverRouter.mount(app, logger.driver, handler)
suiteRouter.mount(app, logger.suite, handler)
sessionRouter.mount(app, logger.session, handler)
driverSocket.use(logger.clients)
driverSocket.listen(process.env.TEST_WSS_PORT!)
app.listen(process.env.TEST_PORT!)
