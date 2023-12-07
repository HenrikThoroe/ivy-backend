import { api } from '@ivy-chess/api-schema'
import { Sink } from 'wss'

type Output = typeof api.games.ws.playerInterface.output

/**
 * Provides methods to interact with
 * clients connected to the player interface socket.
 */
export class PlayerClient {
  private readonly sink: Sink<Output>

  private player?: string

  private lastMoveRequestHistory?: string[]

  constructor(sink: Sink<Output>) {
    this.sink = sink
  }

  //* API

  /**
   * Whether the client is initialized.
   * A client is initialized if a player id
   * is assigned to it.
   */
  public get isInitialized(): boolean {
    return this.player !== undefined
  }

  /**
   * The id of the connected player.
   *
   * @throws If the client is not initialized.
   */
  public get id(): string {
    if (!this.player) {
      throw new Error('Client is not initialized.')
    }

    return this.player
  }

  /**
   * Initializes the client with the given id.
   *
   * @param id The id of the player.
   */
  public init(id: string) {
    this.player = id
  }

  /**
   * Kills the client by requesting the connected
   * socket to be closed.
   */
  public async kill() {
    await this.sink.drain()
  }

  /**
   * Sends a move request to the client.
   * Will not send the same move request twice.
   * Two move requests are considered equal if
   * their history is equal.
   *
   * @param history The history of the game.
   * @param start The start FEN position of the game.
   * @param time The recommended time for the next move.
   */
  public async requestMove(history: string[], start: string, time?: number) {
    const hash = history.join('')
    const lastHash = this.lastMoveRequestHistory?.join('')

    if (lastHash === hash) {
      return
    }

    await this.sink.send('move', {
      key: 'move-req-msg',
      history,
      time,
      start,
    })

    this.lastMoveRequestHistory = history
  }

  /**
   * Sends a game update to the client.
   * The update contains the history of the game.
   *
   * @param history The history of the game.
   * @param start The FEN start position of the game.
   */
  public async update(history: string[], start: string) {
    await this.sink.send('update', {
      key: 'update-msg',
      history,
      start,
    })
  }
}
