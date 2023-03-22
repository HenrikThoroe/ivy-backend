import { resign } from '../../../src/game/actions/resign'
import { create } from '../../../src/game/actions/create'
import { register } from '../../../src/game/actions/register'

describe('Game Resignation', () => {
  it('throws when resigning an inactive game', () => {
    const game = create(1000)

    expect(() => resign(game, 'black')).toThrow()
    expect(() => resign(game, 'white')).toThrow()
  })

  it('sets the winner', () => {
    const game = create(1000)

    register(game, 'black')
    register(game, 'white')

    expect(game.state).toBe('active')
    expect(() => resign(game, 'black')).not.toThrow()
    expect(game.state).toBe('expired')
    expect(game.reason).toBe('resignation')
    expect(game.winner).toBe('white')
  })
})
