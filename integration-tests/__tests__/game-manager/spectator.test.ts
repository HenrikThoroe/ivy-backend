import { Environment } from '../../tools/Environment'
import { WSApiTest } from '../../tools/WSApiTest'
import { setupGame } from '../../tools/testflows/setupGame'

describe('Game-Manager Spectator API', () => {
  beforeAll(Environment.setUp)
  afterAll(Environment.tearDown)

  it('can subscribe to non-existent game', async () => {
    const spectator = await WSApiTest.gameManagerSpectator()

    spectator.send('subscribe', {
      key: 'subscribe-msg',
      id: 'non-existent-game',
    })

    expect(await spectator.isConnected()).toBe(true)

    spectator.exit()
  })

  it('receives initial state after subscribing', async () => {
    const spectator = await WSApiTest.gameManagerSpectator()
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

    expect(await white.isConnected()).toBe(true)
    expect(await black.isConnected()).toBe(true)

    spectator.send('subscribe', {
      key: 'subscribe-msg',
      id: game.id,
    })

    const g = await spectator.expect('state')

    expect(g.game.id).toBe(game.id)
    expect(g.game.game.history).toHaveLength(2)

    spectator.exit()
    white.exit()
    black.exit()
  })

  it('receives state updates', async () => {
    const spectator = await WSApiTest.gameManagerSpectator()
    const { white, black, game } = await setupGame()

    spectator.send('subscribe', {
      key: 'subscribe-msg',
      id: game.id,
    })

    const g1 = await spectator.expect('state')

    expect(g1.game.id).toBe(game.id)
    expect(g1.game.game.history).toHaveLength(0)

    await white.expect('move')
    white.send('move', {
      key: 'move-msg',
      move: 'e2e4',
    })

    const g2 = await spectator.expect('state')

    expect(g2.game.id).toBe(game.id)
    expect(g2.game.game.history).toHaveLength(1)

    await black.expect('move')
    black.send('move', {
      key: 'move-msg',
      move: 'e7e5',
    })

    const g3 = await spectator.expect('state')

    expect(g3.game.id).toBe(game.id)
    expect(g3.game.game.history).toHaveLength(2)

    await white.expect('move')

    expect(await white.isConnected()).toBe(true)
    expect(await black.isConnected()).toBe(true)

    spectator.exit()
    white.exit()
    black.exit()
  })

  it('supports multiple subscriptions', async () => {
    const s1 = await WSApiTest.gameManagerSpectator()
    const s2 = await WSApiTest.gameManagerSpectator()
    const { white, black, game } = await setupGame()

    s1.send('subscribe', {
      key: 'subscribe-msg',
      id: game.id,
    })

    s2.send('subscribe', {
      key: 'subscribe-msg',
      id: game.id,
    })

    const g1_1 = await s1.expect('state')
    const g1_2 = await s2.expect('state')

    expect(g1_1).toEqual(g1_2)

    await white.expect('move')
    white.send('move', {
      key: 'move-msg',
      move: 'e2e4',
    })

    const g2_1 = await s1.expect('state')
    const g2_2 = await s2.expect('state')

    expect(g2_1).toEqual(g2_2)

    await black.expect('move')
    black.send('move', {
      key: 'move-msg',
      move: 'e7e5',
    })

    const g3_1 = await s1.expect('state')
    const g3_2 = await s2.expect('state')

    expect(g3_1).toEqual(g3_2)

    await white.expect('move')

    expect(await white.isConnected()).toBe(true)
    expect(await black.isConnected()).toBe(true)

    s1.exit()
    s2.exit()
    white.exit()
    black.exit()
  })
})
