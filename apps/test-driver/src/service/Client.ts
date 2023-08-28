import { api } from '@ivy-chess/api-schema'
import { TestDriver, TestDriverHardware, TestSuite, UCILog } from '@ivy-chess/model'
import { v4 as uuidv4 } from 'uuid'
import { Sink } from 'wss'
import { z } from 'zod'
import { GameValidation } from './GameValidation'

type Output = typeof api.testing.ws.driverInterface.output

type Report = z.infer<typeof api.testing.ws.reportSchema>

/**
 * A client represents the state of a connected test driver.
 * It is responsible for handling incoming messages and
 * sending responses.
 *
 * A client is bound to one {@link TestDriver} and one {@link Session} at a time.
 * When the client is locked to a session, it can only send requests for games to that
 * exact session. When the session is done or does not longer needs the client
 * the session can unlock the client, so other sessions can use it.
 */
export class Client {
  private readonly sink: Sink<Output>

  private id: string

  private name: string

  private hardware: TestDriverHardware

  private didRegister: boolean

  private sessionId?: string

  constructor(sink: Sink<Output>) {
    this.sink = sink
    this.id = uuidv4()
    this.name = 'Device'
    this.hardware = {}
    this.didRegister = false
  }

  //* API

  /**
   * The {@link TestDriver} data of the device this client
   * is connected to.
   */
  public get driver(): TestDriver {
    return {
      id: this.id,
      name: this.name,
      hardware: this.hardware,
    }
  }

  /**
   * Whether this client is locked to a session.
   */
  public get isLocked(): boolean {
    return this.sessionId !== undefined
  }

  /**
   * The id of the session this client is locked to.
   */
  public get session(): string | undefined {
    return this.sessionId
  }

  /**
   * Locks this client to a session.
   *
   * @param session The id of the session to lock to.
   * @throws If the client is already locked to a session.
   */
  public lock(session: string) {
    if (this.sessionId) {
      throw new Error(`Client '${this.id}' already locked to session '${this.sessionId}'.`)
    }

    this.sessionId = session
  }

  /**
   * Unlocks this client from a session.
   *
   * @param session The session that currently holds the lock.
   * @throws If the client is not locked to the session.
   */
  public unlock(session: string) {
    if (this.sessionId !== session) {
      throw new Error(`Client '${this.id}' not locked to session '${session}'.`)
    }

    this.sessionId = undefined
  }

  /**
   * Requests a new batch of games from the client.
   *
   * @param testSuite The test suite to request games for.
   * @param batchSize The recommended batch size.
   * @throws If the client is not locked to a session.
   */
  public async request(testSuite: TestSuite, batchSize: number) {
    if (!this.sessionId) {
      throw new Error(`Client '${this.id}' not locked to session.`)
    }

    await this.sink.send('request', {
      key: 'start',
      session: this.sessionId,
      suite: testSuite,
      recommendedBatchSize: batchSize,
    })
  }

  /**
   * Registers a test driver with this client.
   * This method can only be called once.
   *
   * @param name The name of the driver. Is choosen by the driver itself.
   * @param hardware The hardware details of the system the driver is runnning on.
   * @param id The id of the driver. Is choosen by the driver itself. If not provided, a random id is generated.
   */
  public async register(name: string, hardware: TestDriverHardware, id?: string) {
    if (this.didRegister) {
      throw new Error(`Client '${this.id}' already registered.`)
    }

    this.name = name
    this.id = id ?? this.id
    this.hardware = hardware
    this.didRegister = true

    await this.sink.send('registered', { key: 'registered', id: this.id })
  }

  /**
   * Reports the results of a batch of games to the client.
   * The client will create new {@link GameValidation}s for each game
   * which than can be processed by the {@link Session}.
   *
   * @param data The report data.
   * @returns The {@link GameValidation}s for the reported games.
   */
  public async report(data: Report): Promise<GameValidation[]> {
    if (!this.didRegister) {
      throw new Error(`Client '${this.id}' not registered.`)
    }

    const validations: GameValidation[] = []
    const hasLogs = data.logs.length === data.moves.length

    for (let i = 0; i < data.moves.length; i++) {
      const validation = new GameValidation()

      validation.addMoves(data.moves[i])
      validation.addDriver({
        id: this.id,
        name: this.name,
        hardware: this.hardware,
      })

      if (hasLogs) {
        const logs: [UCILog, UCILog] = [
          { messages: data.logs[i][0] },
          { messages: data.logs[i][1] },
        ]

        validation.addLog(logs)
      }

      validations.push(validation)
    }

    return validations
  }
}
