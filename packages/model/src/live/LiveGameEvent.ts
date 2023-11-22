/**
 * An event that occured during a live game.
 */
export interface LiveGameEvent {
  /**
   * The type of the event.
   */
  type: 'connect' | 'disconnect' | 'message' | 'create'

  /**
   * The message of the event.
   */
  message: string

  /**
   * The timestamp of the event.
   */
  timestamp: number
}
