import { ApiTest } from '../ApiTest'
import { Environment } from '../Environment'
import { WSApiTest } from '../WSApiTest'

/**
 * A factory method for creating a new live game and
 * returns the white player, the black player and the game.
 *
 * @returns The white player, the black player and the game.
 */
export const setupGame = async () => {
  const white = await WSApiTest.gameManagerPlayer()
  const black = await WSApiTest.gameManagerPlayer()
  const game = await ApiTest.game('create')
    .token(Environment.token)
    .data({
      players: {
        white: {
          type: 'human',
        },
        black: {
          type: 'human',
        },
      },
    })
    .success()

  white.send('checkIn', {
    key: 'check-in-msg',
    player: game.players.white.id,
  })

  expect(await white.isConnected()).toBe(true)

  black.send('checkIn', {
    key: 'check-in-msg',
    player: game.players.black.id,
  })

  expect(await black.isConnected()).toBe(true)

  return { white, black, game }
}
