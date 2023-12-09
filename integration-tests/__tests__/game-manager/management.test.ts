import { ApiTest } from '../../tools/ApiTest'
import { Environment } from '../../tools/Environment'

describe('Game-Manager Management API', () => {
  beforeAll(Environment.setUp)
  afterAll(Environment.tearDown)

  describe('Game Creation', () => {
    it('requires authentication', async () => {
      await ApiTest.game('create').fetch().expect(401)
    })

    it('creates a new game', async () => {
      await ApiTest.game('create')
        .token(Environment.token)
        .data({
          players: {
            white: {
              type: 'human',
              time: 100,
            },
            black: {
              type: 'human',
            },
          },
        })
        .success()

      await ApiTest.game('create')
        .token(Environment.token)
        .rawData({
          players: {
            white: {
              type: 'robot',
              time: 100,
            },
            black: {
              type: 'human',
            },
          },
        })
        .fetch()
        .expect(500)
    })
  })

  describe('Game Fetching', () => {
    it('requires authentication', async () => {
      await ApiTest.game('list').fetch().expect(401)
      await ApiTest.game('get', { id: 'nope' }).fetch().expect(401)
    })

    it('lists existing games', async () => {
      const ids = await ApiTest.game('list').token(Environment.token).success()
      expect(ids).toHaveLength(1)

      const game = await ApiTest.game('create')
        .token(Environment.token)
        .data({
          players: {
            white: {
              type: 'human',
              time: 100,
            },
            black: {
              type: 'human',
            },
          },
        })
        .success()

      const ids2 = await ApiTest.game('list').token(Environment.token).success()
      expect(ids2).toHaveLength(2)
      expect(ids2).toContain(game.id)
    })

    it('fetches an existing game', async () => {
      const list = await ApiTest.game('list').token(Environment.token).success()

      expect(list).toHaveLength(2)

      const id = list[0]
      const game = await ApiTest.game('get', { id }).token(Environment.token).success()

      expect(game.id).toBe(id)
      expect(game.players.white.time).toBe(100)
      expect(game.players.black.time).toBe(undefined)
    })
  })
})
