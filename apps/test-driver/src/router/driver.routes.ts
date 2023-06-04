import { WSServer } from 'wss'
import {
  handleDriverConnection,
  handleDriverFetch,
  handleDriverList,
} from '../controller/driver.controller'
import { Router } from 'express'
import { exceptionWrapper } from 'express-util'
import { v4 as uuidv4 } from 'uuid'

export interface ClientState {
  id: string
}

export const driverMgmtRouter = Router()
export const driverServer = new WSServer<ClientState>(() => ({ id: uuidv4() }))

driverMgmtRouter.get('/', exceptionWrapper(handleDriverList))
driverMgmtRouter.get('/:id', exceptionWrapper(handleDriverFetch))
driverServer.on('connection', handleDriverConnection)
