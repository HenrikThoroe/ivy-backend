import { api } from '@ivy-chess/api-schema'
import { fenEncode } from '@ivy-chess/model'
import { Sink } from 'wss'
import { ChessGame } from './ChessGame'

type Output = typeof api.games.ws.gameInterface.output

/**
 * A `Client` provides an API
 * to send messages to a client over a websocket connection.
 */
export class Client {
  private readonly sink: Sink<Output>

  constructor(sink: Sink<Output>) {
    this.sink = sink
  }

  //* API

  /**
   * Sends a move request to the client.
   *
   * @param game The game to request a move for.
   */
  public async requestMove(game: ChessGame) {
    await this.sink.send('moveRequest', {
      key: 'move-request',
      playerColor: game.data.board.next,
      moves: this.encodeHistory(game),
      time: game.data.time,
    })
  }

  /**
   * Sends a registration confirmation to the client.
   *
   * @param id The id of the player.
   * @param game The game the player is registered for.
   */
  public async confirmRegistration(id: string, game: ChessGame) {
    await this.sink.send('playerInfo', {
      key: 'player-info',
      game: game.data.id,
      player: id,
      color: game.color(id),
    })
  }

  /**
   * Sends the current game state to the client.
   *
   * @param game The game to send the state for.
   */
  public async publishState(game: ChessGame) {
    await this.sink.send('state', {
      key: 'game-state',
      playerColor: game.data.board.next,
      moves: this.encodeHistory(game),
      state: game.data.state,
      time: game.data.time,
      winner: game.data.winner,
      reason: game.data.reason,
    })
  }

  //* Private Methods

  private encodeHistory(game: ChessGame) {
    return game.data.history.map((move) => fenEncode.encodeMove(move))
  }
}
