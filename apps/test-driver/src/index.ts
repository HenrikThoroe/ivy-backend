import cors from 'cors'
import { loadenv } from 'env-util'
import express from 'express'
import helmet from 'helmet'
import { driverRouter } from './api/driver.router'
import { driverSocket } from './api/driver.ws'
import { sessionRouter } from './api/session.router'
import { suiteRouter } from './api/suite.router'

const app = express()

loadenv()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
driverRouter.mount(app)
suiteRouter.mount(app)
sessionRouter.mount(app)
driverSocket.listen(process.env.TEST_WSS_PORT!)
app.listen(process.env.TEST_PORT!)
