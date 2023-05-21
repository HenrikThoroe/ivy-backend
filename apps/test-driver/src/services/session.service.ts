import { TestDriver, TestSuite } from 'model'
import { v4 as uuidv4 } from 'uuid'
import { ClientState } from '../router/driver.routes'
import { CRUD, CRUDStore } from 'express-util'
import { WSClient } from 'wss'

export class TestClient extends CRUD {
  public readonly ws: WSClient<ClientState>
  public readonly driver: TestDriver
  public static store = new CRUDStore<TestClient>()
  public session?: Session

  constructor(ws: WSClient<ClientState>, driver: TestDriver) {
    super(TestClient.store)
    this.ws = ws
    this.driver = driver
    this.save()
  }

  public get id() {
    return this.ws.state.id
  }
}

export class Session extends CRUD {
  private readonly _id: string
  private suite: TestSuite
  private remaining: number
  private driverCount: number
  public static store = new CRUDStore<Session>()

  constructor(suite: TestSuite, driverCount: number) {
    super(Session.store)
    this._id = uuidv4()
    this.suite = suite
    this.remaining = suite.iterations
    this.driverCount = driverCount
    this.save()
  }

  public start() {
    const clients = this.selectDrivers(this.driverCount)
    clients.forEach((c) => this.requestGame(c))
  }

  public remove(client: TestClient) {
    client.session = undefined

    if (this.remaining > 0) {
      const min = this.driverCount === 1 ? 1 : 0
      this.selectDrivers(1, min).forEach((c) => this.requestGame(c))
    }
  }

  public report(client: TestClient) {
    this.remaining -= 1

    if (this.remaining <= 0) {
      client.session = undefined
      return true
    } else {
      this.requestGame(client)
    }

    return false
  }

  private requestGame(client: TestClient) {
    client.ws.send({
      command: 'start',
      session: this.id,
      suite: this.suite,
    })
  }

  private selectDrivers(count: number, min: number = 1): TestClient[] {
    const clients: TestClient[] = []

    for (const client of TestClient.store.list()) {
      if (client.session === undefined) {
        client.session = this
        clients.push(client)
      }

      if (clients.length === count) {
        break
      }
    }

    if (clients.length < min) {
      throw new Error(
        `Not enough drivers available. Requested ${count}, available ${clients.length}.`
      )
    }

    return clients
  }

  public get id() {
    return this._id
  }

  public toJSON() {
    return {
      id: this.id,
      suite: this.suite,
      remaining: this.remaining,
    }
  }
}
