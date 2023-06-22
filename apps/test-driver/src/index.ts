import { loadenv } from 'env-util'

loadenv()

import express from 'express'
import helmet from 'helmet'
import { suiteRouter } from './router/suite.routes'
import { driverMgmtRouter, driverServer } from './router/driver.routes'
import { sessionRouter } from './router/session.router'
import cors from 'cors'
const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/suites', suiteRouter)
app.use('/drivers', driverMgmtRouter)
app.use('/sessions', sessionRouter)
app.listen(process.env.TEST_PORT!)
driverServer.listen(process.env.TEST_WSS_PORT!)
