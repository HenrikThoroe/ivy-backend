import { api, shared } from '@ivy-chess/api-schema'
import {
  EngineTestConfig,
  Game,
  MoveInfo,
  Replay,
  ReplayLog,
  TestDriver,
  UCILog,
  create,
  encode,
  move,
  register,
} from '@ivy-chess/model'
import { encodeMove } from '@ivy-chess/model/src/game/coding/fen_encoding'
import { parseFENMove } from '@ivy-chess/model/src/game/coding/fen_parsing'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

type MoveDetails = z.infer<typeof api.testing.ws.moveSchema>

/**
 * A validated replay and it's log if available.
 */
export interface ValidationResult {
  /**
   * The replay of a validated game.
   */
  replay: Replay

  /**
   * The log to the replay.
   */
  log?: ReplayLog
}

/**
 * A game validation is used to validate a game played by a client.
 * It is used to validate the moves and log entries sent by the client
 * and to create a {@link Replay} of the game.
 *
 * The validation first collects all necessary data and then
 * validates the game and creates the replay.
 *
 * The validation ensures that the game data provided by the
 * external client is valid and that the game was won or drawn.
 */
export class GameValidation {
  private moves?: [MoveDetails[], MoveDetails[]]
  private log?: [UCILog, UCILog]
  private driver?: TestDriver
  private engines?: [EngineTestConfig, EngineTestConfig]
  private final: boolean = false
  private fenHistory: string[] = []

  //* API

  /**
   * Adds the moves of the game.
   *
   * @param moves The moves of the game.
   *              The first entry are the moves by the first engine from the test suite.
   *              The second entry are the moves by the second engine from the test suite.
   */
  public addMoves(moves: [MoveDetails[], MoveDetails[]]) {
    if (this.final) {
      throw new Error('Cannot add moves after finalizing')
    }

    this.moves = moves
  }

  /**
   * Adds the log of the game.
   *
   * @param log The log of the game.
   *            The first entry is the log of the first engine from the test suite.
   *            The second entry is the log of the second engine from the test suite.
   */
  public addLog(log: [UCILog, UCILog]) {
    if (this.final) {
      throw new Error('Cannot add log after finalizing')
    }

    this.log = log
  }

  /**
   * Add details for the system the game was played on.
   *
   * @param driver The test driver that played the game.
   */
  public addDriver(driver: TestDriver) {
    if (this.final) {
      throw new Error('Cannot add driver after finalizing')
    }

    this.driver = driver
  }

  /**
   * Add details for the engines that played the game.
   *
   * @param engines The engines that played the game.
   */
  public addEngines(engines: [EngineTestConfig, EngineTestConfig]) {
    if (this.final) {
      throw new Error('Cannot add engines after finalizing')
    }

    this.engines = engines
  }

  /**
   * Finalizes the validation and creates the {@link Replay}.
   * After calling this method new moves or logs cannot be added.
   *
   * @returns The {@link ValidationResult} containing the replay and log if available.
   * @throws If the game was not won or drawn or data is missing.
   */
  public finalize(): ValidationResult {
    if (!this.moves || !this.driver || !this.engines) {
      throw new Error('Cannot finalize without moves, driver or engines')
    }

    const white = this.getWhiteIndex()
    const black = (white + 1) % 2

    const game = this.play(
      this.moves[white].map((mv) => mv.move),
      this.moves[black].map((mv) => mv.move),
    )

    const replay = this.validate(game, white, black)
    const log = this.joinLog(replay, white, black)

    this.final = true

    return { replay, log }
  }

  //* Private Methods

  private joinLog(replay: Replay, white: number, black: number): ReplayLog | undefined {
    if (!this.log) {
      return undefined
    }

    return {
      replay: replay.id,
      white: this.log[white],
      black: this.log[black],
    }
  }

  private validate(game: Game, white: number, black: number): Replay {
    const id = uuidv4()
    const date = new Date()

    if (!this.moves || !this.driver || !this.engines) {
      throw new Error('Cannot validate without moves, driver or engines')
    }

    if (!game.winner || !game.reason) {
      throw new Error('Game was not won or drawn.')
    }

    if (game.reason === 'time' || game.reason === 'resignation') {
      throw new Error('Game ended in time violation or resignation.')
    }

    return {
      id,
      date,
      driver: this.driver,
      engines: {
        white: this.engines[white],
        black: this.engines[black],
      },
      result: {
        winner: game.winner,
        reason: game.reason,
      },
      history: this.history(game, white, black),
    }
  }

  private history(game: Game, white: number, black: number): MoveInfo[] {
    if (!this.moves) {
      throw new Error('Cannot get history before adding moves')
    }

    let colorIdx = white
    const history: MoveInfo[] = []

    for (let i = 0; i < game.history.length; ++i) {
      const idx = Math.floor(i / 2)

      if (idx >= this.moves[colorIdx].length) {
        throw new Error('Game hostory and moves do not match')
      }

      const details = this.moves[colorIdx][idx]
      const historyMove = encodeMove(game.history[i])

      if (details.move !== historyMove) {
        throw new Error(
          `Game history contains different moves than received from client (${details.move}, ${historyMove})`,
        )
      }

      const move: MoveInfo = {
        move: { ...game.history[i] },
        fen: this.fenHistory[i],
        details: details,
      }

      history.push(shared.replay.moveInfoSchema.parse(move))
      colorIdx = colorIdx === white ? black : white
    }

    return history
  }

  private play(white: string[], black: string[]): Game {
    const game = create({
      timeback: 0,
      timeout: Infinity,
    })

    register(game, 'white')
    register(game, 'black')

    const max = white.length + black.length
    let idx = 0

    for (let i = 0; i < max; ++i) {
      const moves = game.board.next === 'white' ? white : black

      if (idx >= moves.length) {
        break
      }

      move(game, moves[idx])

      this.fenHistory.push(encode(game.board))

      if (game.state === 'expired') {
        break
      }

      if (game.board.next === 'white') {
        idx += 1
      }
    }

    return game
  }

  private getWhiteIndex() {
    if (!this.moves) {
      throw new Error('Cannot get white index before adding moves')
    }

    if (this.moves[0].length === 0 && this.moves[1].length === 0) {
      throw new Error('Cannot get white index when neither engine made a move')
    }

    const engine = this.moves[0].length > 0 ? 0 : 1
    const move = parseFENMove(this.moves[engine][0].move)

    if (move === 'nullmove') {
      throw new Error('Nullmoves are not allowed in test games.')
    }

    const [source, target] = move
    const diff = target - source

    if (diff < 0) {
      return engine
    }

    return engine === 0 ? 1 : 0
  }
}
