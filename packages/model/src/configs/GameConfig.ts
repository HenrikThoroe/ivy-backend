/**
 * Configuration used to create new games.
 */
export interface GameConfig {
  /**
   * The timeout in milliseconds for both players.
   */
  timeout: number

  /**
   * The timeback in milliseconds for both players.
   */
  timeback: number

  /**
   * The start position of the game.
   */
  startFen?: string
}
