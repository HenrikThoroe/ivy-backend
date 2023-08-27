import { Color, Game, GameConfig, create, move, register, resign } from '@ivy-chess/model'
import { store } from 'kv-store'

const gameStore = store.take('games').take('matches')

/**
 * Provides an interface to interact with a chess game.
 * Will ensure that actions are only performed by the correct player.
 * Changes to the game state will be persisted.
 */
export class ChessGame {
  private readonly game: Game

  private constructor(game: Game) {
    this.game = game
  }

  //* API

  /**
   * Creates a new game and saves it to the database.
   * The game will expire after a set amount of time
   * which is linear to the timeout of the game.
   *
   * @param config The configuration of the game.
   * @returns The created game.
   */
  public static async create(config: GameConfig) {
    const game = create(config)
    const offset = 60 * 60 * 24
    const expiration = (config.timeout / 1000) * 6 + offset

    await gameStore.take(game.id).write(game, { expiration })

    return new ChessGame(game)
  }

  /**
   * Loads a game from the database.
   *
   * @param id The id of the game.
   * @returns The loaded game.
   * @throws If the game does not exist.
   */
  public static async load(id: string) {
    const game = await gameStore.take(id).read()

    if (!game) {
      throw Error(`Game with id ${id} does not exist.`)
    }

    return new ChessGame(game)
  }

  /**
   * Whether the another move is expected.
   */
  public get next(): boolean {
    return this.game.state === 'active' || this.game.state === 'waiting'
  }

  /**
   * The data of the game.
   */
  public get data() {
    return this.game
  }

  /**
   * The id of the white player.
   */
  public get white(): string | undefined {
    return this.game.players.white
  }

  /**
   * The id of the black player.
   */
  public get black(): string | undefined {
    return this.game.players.black
  }

  /**
   * Performs the move given in FEN encoding for the player.
   *
   * @param player The player to move.
   * @param fen The move in FEN encoding.
   * @throws If the player is not allowed to move or the move is invalid.
   */
  public async move(player: string, fen: string) {
    const color = this.color(player)

    if (this.game.board.next !== color) {
      throw Error(
        `Player with id '${player}' cannot move for '${this.game.board.next}' in game '${this.game.id}'.`,
      )
    }

    move(this.game, fen)
    this.game.lastRequest = Date.now()
    await gameStore.take(this.game.id).write(this.game)
  }

  /**
   * Registers a player for the game.
   *
   * @param color The color the player wants to play.
   * @returns The id of the player.
   * @throws If the player is already registered or no more players can be registered.
   */
  public async register(color?: Color) {
    const id = register(this.game, color)
    await gameStore.take(this.game.id).write(this.game)
    return id
  }

  /**
   * Resigns the game for the player.
   * The other player will win.
   *
   * @param player The player to resign.
   */
  public async resign(player: string) {
    const color = this.color(player)

    resign(this.game, color)
    await gameStore.take(this.game.id).write(this.game)
  }

  /**
   * Returns the color of the player.
   *
   * @param player The id of the player.
   * @returns The color of the player.
   * @throws If the player is not part of the game.
   */
  public color(player: string): Color {
    if (this.game.players.black === player) {
      return 'black'
    }

    if (this.game.players.white === player) {
      return 'white'
    }

    throw Error(`Player with id '${player}' is not part of game '${this.game.id}'.`)
  }
}
