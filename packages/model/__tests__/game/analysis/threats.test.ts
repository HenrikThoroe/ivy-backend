import { hasThreat } from '../../../src/game/analysis/threats'
import { decode } from '../../../src/game/model/Board'

describe('Threats', () => {
  it('finds pawn threats', () => {
    const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
    const board = decode(fen)

    expect(hasThreat(board, 'white', 20)).toBe(true)
    expect(hasThreat(board, 'white', 17)).toBe(true)
    expect(hasThreat(board, 'white', 34)).toBe(true)
    expect(hasThreat(board, 'white', 36)).toBe(true)

    expect(hasThreat(board, 'white', 0)).toBe(false)
    expect(hasThreat(board, 'white', 26)).toBe(true)
    expect(hasThreat(board, 'white', 35)).toBe(true)
    expect(hasThreat(board, 'white', 63)).toBe(false)

    expect(hasThreat(board, 'black', 32)).toBe(true)
    expect(hasThreat(board, 'black', 34)).toBe(true)
    expect(hasThreat(board, 'black', 36)).toBe(true)

    expect(hasThreat(board, 'black', 50)).toBe(false)
  })

  it('finds bishop threats', () => {
    const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
    const board = decode(fen)

    expect(hasThreat(board, 'white', 11)).toBe(true)
    expect(hasThreat(board, 'white', 20)).toBe(true)
    expect(hasThreat(board, 'white', 29)).toBe(true)
    expect(hasThreat(board, 'black', 40)).toBe(true)
    expect(hasThreat(board, 'black', 56)).toBe(true)
    expect(hasThreat(board, 'black', 58)).toBe(true)
  })

  it('finds rook threats', () => {
    const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
    const board = decode(fen)

    expect(hasThreat(board, 'white', 3)).toBe(true)
    expect(hasThreat(board, 'white', 4)).toBe(true)
    expect(hasThreat(board, 'black', 52)).toBe(true)
    expect(hasThreat(board, 'black', 53)).toBe(true)
    expect(hasThreat(board, 'black', 59)).toBe(true)
    expect(hasThreat(board, 'black', 57)).toBe(true)
  })

  it('finds queen threats', () => {
    const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
    const board = decode(fen)

    expect(hasThreat(board, 'black', 3)).toBe(true)
    expect(hasThreat(board, 'black', 4)).toBe(true)
    expect(hasThreat(board, 'black', 5)).toBe(true)
    expect(hasThreat(board, 'black', 11)).toBe(true)
    expect(hasThreat(board, 'black', 19)).toBe(true)
    expect(hasThreat(board, 'black', 20)).toBe(true)
    expect(hasThreat(board, 'black', 21)).toBe(true)
    expect(hasThreat(board, 'black', 13)).toBe(true)

    expect(hasThreat(board, 'black', 15)).toBe(false)

    expect(hasThreat(board, 'white', 26)).toBe(true)
    expect(hasThreat(board, 'white', 35)).toBe(true)
    expect(hasThreat(board, 'white', 44)).toBe(true)
    expect(hasThreat(board, 'white', 53)).toBe(true)
    expect(hasThreat(board, 'white', 62)).toBe(true)
  })

  it('finds king threats', () => {
    const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
    const board = decode(fen)

    expect(hasThreat(board, 'white', 7)).toBe(true)
    expect(hasThreat(board, 'white', 15)).toBe(true)
    expect(hasThreat(board, 'black', 62)).toBe(true)
    expect(hasThreat(board, 'black', 55)).toBe(true)
  })

  it('finds knight threats', () => {
    const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
    const board = decode(fen)

    expect(hasThreat(board, 'white', 28)).toBe(true)
    expect(hasThreat(board, 'white', 55)).toBe(true)

    expect(hasThreat(board, 'black', 28)).toBe(true)
    expect(hasThreat(board, 'black', 55)).toBe(true)
    expect(hasThreat(board, 'black', 62)).toBe(true)
    expect(hasThreat(board, 'black', 35)).toBe(true)
  })
})
