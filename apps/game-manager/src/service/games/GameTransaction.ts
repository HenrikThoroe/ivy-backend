import { Color, LiveGame, fenEncode, move, resign } from '@ivy-chess/model'
import AwaitLock from 'await-lock'

type CommitHandler = (game: LiveGame) => Promise<void>

const locks = new Map<string, AwaitLock>()

/**
 * A game transaction parses a `LiveGame` and
 * provides methods to modify the game state.
 *
 * The transaction can be committed using the `commit` method,
 * which will write the changes back to the database.
 */
export class GameTransaction {
  private readonly game: LiveGame

  private readonly onCommit: CommitHandler

  private constructor(game: LiveGame, onCommit: CommitHandler) {
    this.game = game
    this.onCommit = onCommit
  }

  //* API

  /**
   * Acquires a transaction for the game with the given id.
   * The transaction can be used to modify the game state.
   * After using the transaction, it must be committed
   * or canceled using the `commit` or `cancel` method.
   *
   * @param id The id of the game.
   * @param factory A factory to fetch the game data when the transaction has been acquired.
   * @param onCommit A handler to be called when the transaction is committed. Should persist the changes.
   * @returns A transaction for the game.
   */
  public static async acquire(
    id: string,
    factory: () => Promise<LiveGame>,
    onCommit: CommitHandler,
  ): Promise<GameTransaction> {
    if (!locks.has(id)) {
      locks.set(id, new AwaitLock())
    }

    await locks.get(id)!.acquireAsync()
    return new GameTransaction(await factory(), onCommit)
  }

  /**
   * Whether the game is finished or still expects moves.
   */
  public get isFinished(): boolean {
    return this.game.game.winner !== undefined
  }

  /**
   * The participant ids of the game.
   * The first id is always the white player.
   * The second id is always the black player.
   */
  public get participants(): string[] {
    return [this.game.players.white.id, this.game.players.black.id]
  }

  /**
   * The id of the player who is expected to move next.
   * If the game is finished, this will throw an error.
   *
   * Before calling check `isFinished`.
   *
   * @throws If the game is finished.
   */
  public get next(): string {
    if (this.isFinished) {
      throw new Error('Cannot get next client for finished transaction.')
    }

    const color = this.game.game.board.next
    return this.game.players[color].id
  }

  /**
   * The history of the game, which contains all moves
   * encoded as FEN strings.
   */
  public get history(): string[] {
    return this.game.game.history.map((move) => fenEncode.encodeMove(move))
  }

  /**
   * Modifies the game state to indicate that the given player
   * has connected to the game.
   *
   * @param player The id of the player who connected.
   */
  public connect(player: string) {
    this.game.events.push({
      type: 'connect',
      message: `Player '${player}' connected.`,
      timestamp: Date.now(),
    })

    this.game.players[this.color(player)].connected = true
  }

  /**
   * Modifies the game state to indicate that the given player
   * has disconnected from the game.
   *
   * @param player The id of the player who disconnected.
   */
  public disconnect(player: string) {
    this.game.events.push({
      type: 'disconnect',
      message: `Player '${player}' disconnected.`,
      timestamp: Date.now(),
    })

    this.game.players[this.color(player)].connected = false
  }

  /**
   * The time the given player should use for the next move.
   *
   * @param player The id of the player.
   * @returns The time the player should use for the next move.
   */
  public recommendedTime(player: string): number | undefined {
    return this.game.players[this.color(player)].time
  }

  /**
   * Applies a move to the game.
   * This methods will modify the game state
   * and requires a commit to persist the changes.
   *
   * @param fen The FEN encoded move.
   */
  public move(fen: string): void {
    this.game.events.push({
      type: 'message',
      message: `Player '${this.next}' (${this.color(this.next)}) performed move '${fen}'.`,
      timestamp: Date.now(),
    })

    move(this.game.game, fen)

    if (this.isFinished) {
      this.game.isActive = false
    }
  }

  /**
   * Resigns the game for the given player.
   * This methods will modify the game state
   * and requires a commit to persist the changes.
   *
   * @param player The id of the player who resigns.
   */
  public resign(player: string): void {
    this.game.events.push({
      type: 'message',
      message: `Player '${player}' (${this.color(player)}) resigned.`,
      timestamp: Date.now(),
    })

    resign(this.game.game, this.color(player))

    if (this.isFinished) {
      this.game.isActive = false
    }
  }

  /**
   * Commits the changes to the database
   * and releases the lock on the game.
   */
  public async commit(): Promise<void> {
    await this.onCommit(this.game)
    this.cancel()
  }

  /**
   * Cancels the transaction,
   * which will release the lock on the game
   * without persisting the changes.
   */
  public cancel() {
    locks.get(this.game.id)?.release()
  }

  //* Private Methods

  private color(player: string): Color {
    if (this.game.players.white.id === player) {
      return 'white'
    }

    if (this.game.players.black.id === player) {
      return 'black'
    }

    throw new Error(`No player found for id '${player}'.`)
  }
}
