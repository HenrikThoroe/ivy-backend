import { Color, LiveGame, fenEncode, move, resign } from '@ivy-chess/model'

/**
 * A game transaction parses a `LiveGame` and
 * provides methods to modify the game state.
 *
 * The transaction can be committed using the `commit` method,
 * which will write the changes back to the database.
 */
export class GameTransaction {
  private readonly game: LiveGame

  private readonly onCommit: (game: LiveGame) => Promise<void>

  constructor(game: LiveGame, onCommit: (game: LiveGame) => Promise<void>) {
    this.game = game
    this.onCommit = onCommit
  }

  //* API

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
    resign(this.game.game, this.color(player))

    if (this.isFinished) {
      this.game.isActive = false
    }
  }

  /**
   * Commits the changes to the database.
   */
  public async commit(): Promise<void> {
    await this.onCommit(this.game)
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
