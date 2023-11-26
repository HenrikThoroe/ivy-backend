import { ApiTest } from '../../tools/ApiTest'
import { Environment } from '../../tools/Environment'
import { WSApiTest } from '../../tools/WSApiTest'

const setupGame = async () => {
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

describe('Game-Manager Player API', () => {
  beforeAll(Environment.setUp)
  afterAll(Environment.tearDown)

  describe('Check In', () => {
    it('requires existing player id', async () => {
      const api = await WSApiTest.gameManagerPlayer()

      api.send('checkIn', {
        key: 'check-in-msg',
        player: 'nope',
      })

      expect(await api.isConnected()).toBe(false)
    })

    it('can check-in with white before black', async () => {
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

      await white.expect('move')

      white.exit()
      black.exit()
    })

    it('can check-in with black before white', async () => {
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

      black.send('checkIn', {
        key: 'check-in-msg',
        player: game.players.black.id,
      })

      expect(await black.isConnected()).toBe(true)

      white.send('checkIn', {
        key: 'check-in-msg',
        player: game.players.white.id,
      })

      expect(await black.isConnected()).toBe(true)

      await white.expect('move')

      white.exit()
      black.exit()
    })
  })

  describe('Move', () => {
    it('will send move requests to the next player', async () => {
      const { white, black } = await setupGame()
      const { history: h1 } = await white.expect('move')

      expect(h1).toHaveLength(0)

      white.send('move', {
        key: 'move-msg',
        move: 'g1f3',
      })

      const { history: h2 } = await black.expect('move')

      expect(h2).toHaveLength(1)
      expect(h2[0]).toBe('g1f3')

      black.send('move', {
        key: 'move-msg',
        move: 'g8f6',
      })

      const { history: h3 } = await white.expect('move')

      expect(h3).toHaveLength(2)
      expect(h3[0]).toBe('g1f3')
      expect(h3[1]).toBe('g8f6')

      white.exit()
      black.exit()
    })

    it('will disconnect when an unexpected move is received', async () => {
      const { white, black } = await setupGame()
      const { history: h1 } = await white.expect('move')

      expect(h1).toHaveLength(0)

      black.send('move', {
        key: 'move-msg',
        move: 'g1f3',
      })

      expect(await black.isConnected()).toBe(false)
      expect(await white.isConnected()).toBe(true)

      white.exit()
      black.exit()
    })

    it('can reconnect after being disconnected', async () => {
      let { white, black, game } = await setupGame()
      const { history: h1 } = await white.expect('move')

      expect(h1).toHaveLength(0)

      black.send('move', {
        key: 'move-msg',
        move: 'g1f3',
      })

      white.send('move', {
        key: 'move-msg',
        move: 'g1f3',
      })

      expect(await black.isConnected()).toBe(false)
      expect(await white.isConnected()).toBe(true)

      black = await WSApiTest.gameManagerPlayer()
      black.send('checkIn', {
        key: 'check-in-msg',
        player: game.players.black.id,
      })

      expect(await black.isConnected()).toBe(true)
      expect(await white.isConnected()).toBe(true)

      const { history: h2 } = await black.expect('move')

      expect(h2).toHaveLength(1)
      expect(h2[0]).toBe('g1f3')

      white.exit()
      black.exit()
    })

    it('diconnects after game is finished', async () => {
      const { white, black, game } = await setupGame()

      await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'e2e4',
      })

      await black.expect('move')

      black.send('move', {
        key: 'move-msg',
        move: 'e7e5',
      })

      await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'f1c4',
      })

      await black.expect('move')

      black.send('move', {
        key: 'move-msg',
        move: 'b8c6',
      })

      await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'd1h5',
      })

      await black.expect('move')

      black.send('move', {
        key: 'move-msg',
        move: 'g8f6',
      })

      await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'h5f7',
      })

      expect(await white.isConnected()).toBe(false)
      expect(await black.isConnected()).toBe(false)

      white.exit()
      black.exit()

      const res = await ApiTest.game('get', { id: game.id }).token(Environment.token).success()

      expect(res.isActive).toBe(false)
      expect(res.game.winner).toBe('white')
      expect(res.game.reason).toBe('checkmate')
    })

    it('ignores rule violations and disconnects client', async () => {
      let { white, black, game } = await setupGame()

      await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'e2e4',
      })

      await black.expect('move')

      black.send('move', {
        key: 'move-msg',
        move: 'e7e5',
      })

      await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'f1c5',
      })

      expect(await white.isConnected()).toBe(false)
      expect(await black.isConnected()).toBe(true)

      white = await WSApiTest.gameManagerPlayer()
      white.send('checkIn', {
        key: 'check-in-msg',
        player: game.players.white.id,
      })

      expect(await white.isConnected()).toBe(true)
      expect(await black.isConnected()).toBe(true)

      const { history: h1 } = await white.expect('move')

      expect(h1).toHaveLength(2)
      expect(h1[0]).toBe('e2e4')
      expect(h1[1]).toBe('e7e5')

      white.exit()
      black.exit()

      const res = await ApiTest.game('get', { id: game.id }).token(Environment.token).success()

      expect(res.isActive).toBe(true)
      expect(res.game.winner).toBeUndefined()
      expect(res.game.reason).toBeUndefined()
    })

    it('sends the recommended move time as configured', async () => {
      const white = await WSApiTest.gameManagerPlayer()
      const black = await WSApiTest.gameManagerPlayer()
      const game = await ApiTest.game('create')
        .token(Environment.token)
        .data({
          players: {
            white: {
              type: 'human',
              time: 42,
            },
            black: {
              type: 'engine',
              time: 345,
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

      const { time: t1 } = await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'e2e4',
      })

      expect(t1).toBe(42)

      const { time: t2 } = await black.expect('move')

      expect(t2).toBe(345)

      white.exit()
      black.exit()
    })
  })

  describe('Resign', () => {
    it('will disconnect all clients after a resignation', async () => {
      const { white, black } = await setupGame()

      await white.expect('move')

      white.send('resign', {
        key: 'resign-msg',
      })

      expect(await white.isConnected()).toBe(false)
      expect(await black.isConnected()).toBe(false)

      white.exit()
      black.exit()
    })

    it('will accept a resign message from waiting clients', async () => {
      const { white, black } = await setupGame()

      await white.expect('move')

      black.send('resign', {
        key: 'resign-msg',
      })

      expect(await white.isConnected()).toBe(false)
      expect(await black.isConnected()).toBe(false)

      white.exit()
      black.exit()
    })

    it('will assign the winner to the other player', async () => {
      const { white, black, game } = await setupGame()

      await white.expect('move')

      white.send('resign', {
        key: 'resign-msg',
      })

      expect(await white.isConnected()).toBe(false)
      expect(await black.isConnected()).toBe(false)

      const res = await ApiTest.game('get', { id: game.id }).token(Environment.token).success()

      expect(res.isActive).toBe(false)
      expect(res.game.winner).toBe('black')
      expect(res.game.reason).toBe('resignation')

      white.exit()
      black.exit()
    })
  })

  describe('Updates', () => {
    it('will send updates to all clients', async () => {
      const { white, black } = await setupGame()

      await white.expect('move')

      white.send('move', {
        key: 'move-msg',
        move: 'e2e4',
      })

      await black.expect('move')

      black.send('update', {
        key: 'update-req-msg',
      })

      const { history: h1 } = await black.expect('update')

      white.send('update', {
        key: 'update-req-msg',
      })

      const { history: h2 } = await white.expect('update')

      expect(h1).toHaveLength(1)
      expect(h1[0]).toBe('e2e4')
      expect(h2).toHaveLength(1)
      expect(h2[0]).toBe('e2e4')

      white.exit()
      black.exit()
    })
  })
})
