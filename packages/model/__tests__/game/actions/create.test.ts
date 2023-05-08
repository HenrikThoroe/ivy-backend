import { create } from '../../../src/game/actions/create'
import { decode } from '../../../src/game/model/Board'

describe('Create Game Action', () => {
  it('starts with the standard chess position', () => {
    const game = create({ timeout: 1000 })
    expect(game.board).toEqual(decode('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'))
  })

  it('sets correct timeouts', () => {
    const game = create({ timeout: 1000 })
    expect(game.time).toEqual({ white: 1000, black: 1000 })
  })

  it('sets correct timeouts', () => {
    const game = create({ timeout: 1000 })
    expect(game.time).toEqual({ white: 1000, black: 1000 })
  })

  it('has empty history', () => {
    const game = create({ timeout: 1000 })
    expect(game.history).toHaveLength(0)
  })

  it('is waiting', () => {
    const game = create({ timeout: 1000 })
    expect(game.state).toBe('waiting')
    expect(game.players.black).toBe(undefined)
    expect(game.players.white).toBe(undefined)
  })
})
