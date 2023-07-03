import { create } from '../../../src/game/actions/create'
import { register } from '../../../src/game/actions/register'

describe('Game Player Registration', () => {
  it('creates different ids', () => {
    const game = create({ timeout: 1000, timeback: 0 })
    const ids = [register(game, 'black'), register(game, 'white')]

    expect(ids[0]).not.toBe(ids[1])
  })

  it('assigns both slots when no color is requested', () => {
    const game = create({ timeout: 1000, timeback: 0 })
    const ids = [register(game), register(game)]

    expect(ids[0]).not.toBe(ids[1])
  })

  it('throws on more thann two attempts', () => {
    const game = create({ timeout: 1000, timeback: 0 })

    register(game)
    register(game)

    expect(() => register(game)).toThrow()
    expect(() => register(game, 'white')).toThrow()
    expect(() => register(game, 'black')).toThrow()
  })

  it('throws when assigning a color twice', () => {
    const game = create({ timeout: 1000, timeback: 0 })
    register(game, 'white')
    expect(() => register(game, 'white')).toThrow()
  })
})
