import { TestSuite } from '@ivy-chess/model'
import { channels } from 'com'
import { v4 as uuidv4 } from 'uuid'
import { Client } from './Client'
import { ClientManager } from './ClientManager'
import { GameValidation, ValidationResult } from './GameValidation'

/**
 * A session is used to collect the results of games played for
 * a {@link TestSuite}. The session distributes games
 * across multiple {@link Client}s and collects the results.
 *
 * Use the {@link ClientManager} to create and finds sessions.
 */
export class Session {
  /**
   * The id of the session.
   */
  public readonly id: string

  /**
   * The targeted number of clients to use simultaneously.
   */
  public readonly concurrency: number

  /**
   * The {@link TestSuite} of the session.
   */
  public readonly suite: TestSuite

  private remaining: number

  constructor(suite: TestSuite, concurrency: number) {
    this.id = uuidv4()
    this.suite = suite
    this.remaining = suite.iterations
    this.concurrency = concurrency
  }

  //* API

  /**
   * The number of remaining games to play.
   */
  public get remainingGames() {
    return this.remaining
  }

  /**
   * Whether all games have been played.
   */
  public get completed() {
    return this.remaining <= 0
  }

  /**
   * Shuts down the session.
   * This will stop the session from requesting new games
   * but will not stop the clients from playing their current games.
   *
   * If another game is added to the session, the session will
   * handle them as usual.
   */
  public shutdown() {
    this.remaining = 0
  }

  /**
   * Adds a game to the session.
   *
   * @param client The client that played the game.
   * @param validations The validations of the game with data from the client.
   */
  public async add(client: Client, ...validations: GameValidation[]) {
    validations.forEach((v) => v.addEngines(this.suite.engines))

    const results: ValidationResult[] = []

    for (const validation of validations) {
      try {
        const result = validation.finalize()

        await channels.replays.sender().send('add', result.replay)

        if (result.log) {
          await channels.replays.sender().send('addLog', result.log)
        }

        results.push(result)
      } catch (e) {
        console.error(`Failed to add game to session '${this.id}'`)
        console.error(e)
      }
    }

    this.remaining -= results.length

    if (this.completed) {
      client.unlock(this.id)
    } else {
      await client.request(this.suite, this.batchSize)
    }
  }

  /**
   * Replaces a client in the session.
   * The session will try to find a new, free client
   * and request a new game from it.
   */
  public async replace() {
    const clients = ClientManager.shared.find(0, 1)

    if (clients.length === 1) {
      const client = clients[0]

      client.lock(this.id)
      await client.request(this.suite, this.batchSize)
    }
  }

  /**
   * Starts the session by requesting games from the clients.
   * If not enough clients are available, the session will
   * throw an error.
   *
   * @throws If there are not enough free clients.
   */
  public async start() {
    const clients = ClientManager.shared.find(this.concurrency, this.concurrency)

    const tasks: Promise<void>[] = []

    for (const client of clients) {
      client.lock(this.id)
      tasks.push(client.request(this.suite, this.batchSize))
    }

    await Promise.all(tasks)
  }

  //* Private Methods

  private get batchSize() {
    let base = 10

    if (this.remaining < base) {
      base = this.remaining
    }

    const remainder = base % 2
    return (base + remainder) / 2
  }
}
