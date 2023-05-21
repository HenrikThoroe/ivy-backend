import { WSServer } from 'wss'
import { RegisterBody, ReportBody } from '../controller/driver.types'
import { handleDriverFetch, handleDriverList } from '../controller/driver.controller'
import { Router } from 'express'
import { exceptionWrapper } from 'express-util'
import { v4 as uuidv4 } from 'uuid'
import { Session, TestClient } from '../services/session.service'

export const driverMgmtRouter = Router()

export interface ClientState {
  readonly id: string
}

driverMgmtRouter.get('/', exceptionWrapper(handleDriverList))
driverMgmtRouter.get('/:id', exceptionWrapper(handleDriverFetch))

export const driverServer = new WSServer<ClientState>(() => ({ id: uuidv4() }))

driverServer.on('connection', async (client) => {
  client.on(RegisterBody, async (data) => {
    const testClient = new TestClient(client, {
      name: data.name,
      hardware: data.hardware,
      id: client.state.id,
    })

    client.send({ type: 'registered', id: testClient.id })
  })

  client.on(ReportBody, async (data) => {
    const session = Session.store.fetch(data.session)
    const testClient = TestClient.store.fetch(client.state.id)

    if (session && testClient) {
      const isFinished = session.report(testClient)

      if (isFinished) {
        session.delete()
      }
    }
  })

  client.on('close', async () => {
    const testClient = TestClient.store.fetch(client.state.id)

    if (testClient) {
      testClient.delete()
    }
  })
})
