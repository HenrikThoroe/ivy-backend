import { Request, Response } from 'express'
import { Session, TestClient } from '../services/session.service'
import { TestDriver } from '@ivy-chess/model'
import { WSClient } from 'wss'
import { ClientState } from '../router/driver.routes'
import { RegisterBody, ReportBody } from './driver.types'

export async function handleDriverList(req: Request, res: Response) {
  const clients = TestClient.store.list()
  const drivers: TestDriver[] = clients.map((c) => c.driver)

  res.json(drivers)
}

export async function handleDriverFetch(req: Request, res: Response) {
  const id = req.params.id

  try {
    const driver = TestClient.store.fetch(id)
    res.json(driver)
  } catch {
    res.status(404).json({ reason: `Test driver with id ${id} does not exist.` })
  }
}

export async function handleDriverConnection(client: WSClient<ClientState>) {
  client.on(RegisterBody, async (data) => {
    let deviceId = data.deviceId ?? client.state.id

    if (deviceId.length === 0) {
      deviceId = client.state.id
    }

    const testClient = new TestClient(client, {
      name: data.name,
      hardware: data.hardware,
      id: deviceId,
    })

    client.send({ key: 'registered', id: testClient.id })
  })

  client.on(ReportBody, async (data) => {
    const session = Session.store.fetch(data.session)
    const testClient = TestClient.store.fetch(client.state.id)

    if (session && testClient) {
      const isFinished = session.report(testClient, data.moves, data.logs)

      if (isFinished) {
        session.delete()
      }
    } else if (testClient) {
      testClient.session = undefined
    }
  })

  client.on('close', async () => {
    const testClient = TestClient.store.fetch(client.state.id)
    const session = testClient?.session

    testClient?.delete()

    if (testClient && session) {
      const didTerminate = session.remove(testClient)

      if (didTerminate) {
        session.delete()
      }
    }
  })
}
