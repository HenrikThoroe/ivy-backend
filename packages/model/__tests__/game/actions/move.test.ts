import { Color, Game } from '../../../src'
import { create } from '../../../src/game/actions/create'
import { move } from '../../../src/game/actions/move'
import { register } from '../../../src/game/actions/register'
import { GameResult } from '../../../src/game/analysis/end'
import { parseFENMove } from '../../../src/game/coding/fen'
import { decode } from '../../../src/game/model/Board'

const validateMove = (
  start: string,
  expected: string,
  mv: string,
  options?: { ruleViolation: boolean },
  validation?: (game: Game) => void
) => {
  const board = decode(start)
  const game = create(1000)

  register(game)
  register(game)

  game.board = board

  expect(() => move(game, mv)).not.toThrow()
  expect(game.board).toEqual(decode(expected))

  if (options?.ruleViolation === true) {
    expect(game.state).toBe('expired')
    expect(game.reason).toBe('rule-violation')
    expect(game.winner).not.toBe(undefined)
    expect(game.winner).not.toBe(game.board.next)
  } else {
    expect(game.state).toBe('active')
    expect(game.reason).toBe(undefined)
  }

  validation?.call(null, game)
}

describe('Game Move Action', () => {
  it('performs valid moves', () => {
    const game = create(1000)
    let index = 0
    const moves = [
      'g1f3',
      'g8f6',
      'b2b3',
      'd7d5',
      'c1b2',
      'c8g4',
      'g2g3',
      'g4f3',
      'e2f3',
      'e7e6',
      'f1g2',
      'g7g6',
      'e1g1',
      'f8g7',
      'c2c4',
      'e8g8',
      'f3f4',
      'b8c6',
      'b1c3',
      'd5c4',
      'b3c4',
      'd8d3',
      'f1e1',
      'f8d8',
      'c3b5',
      'd3c4',
      'a2a4',
      'a7a6',
    ]
    const fen = [
      'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1',
      'rnbqkb1r/pppppppp/5n2/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 2 2',
      'rnbqkb1r/pppppppp/5n2/8/8/1P3N2/P1PPPPPP/RNBQKB1R b KQkq - 0 2',
      'rnbqkb1r/ppp1pppp/5n2/3p4/8/1P3N2/P1PPPPPP/RNBQKB1R w KQkq d6 0 3',
      'rnbqkb1r/ppp1pppp/5n2/3p4/8/1P3N2/PBPPPPPP/RN1QKB1R b KQkq - 1 3',
      'rn1qkb1r/ppp1pppp/5n2/3p4/6b1/1P3N2/PBPPPPPP/RN1QKB1R w KQkq - 2 4',
      'rn1qkb1r/ppp1pppp/5n2/3p4/6b1/1P3NP1/PBPPPP1P/RN1QKB1R b KQkq - 0 4',
      'rn1qkb1r/ppp1pppp/5n2/3p4/8/1P3bP1/PBPPPP1P/RN1QKB1R w KQkq - 0 5',
      'rn1qkb1r/ppp1pppp/5n2/3p4/8/1P3PP1/PBPP1P1P/RN1QKB1R b KQkq - 0 5',
      'rn1qkb1r/ppp2ppp/4pn2/3p4/8/1P3PP1/PBPP1P1P/RN1QKB1R w KQkq - 0 6',
      'rn1qkb1r/ppp2ppp/4pn2/3p4/8/1P3PP1/PBPP1PBP/RN1QK2R b KQkq - 1 6',
      'rn1qkb1r/ppp2p1p/4pnp1/3p4/8/1P3PP1/PBPP1PBP/RN1QK2R w KQkq - 0 7',
      'rn1qkb1r/ppp2p1p/4pnp1/3p4/8/1P3PP1/PBPP1PBP/RN1Q1RK1 b kq - 1 7',
      'rn1qk2r/ppp2pbp/4pnp1/3p4/8/1P3PP1/PBPP1PBP/RN1Q1RK1 w kq - 2 8',
      'rn1qk2r/ppp2pbp/4pnp1/3p4/2P5/1P3PP1/PB1P1PBP/RN1Q1RK1 b kq c3 0 8',
      'rn1q1rk1/ppp2pbp/4pnp1/3p4/2P5/1P3PP1/PB1P1PBP/RN1Q1RK1 w - - 1 9',
      'rn1q1rk1/ppp2pbp/4pnp1/3p4/2P2P2/1P4P1/PB1P1PBP/RN1Q1RK1 b - - 0 9',
      'r2q1rk1/ppp2pbp/2n1pnp1/3p4/2P2P2/1P4P1/PB1P1PBP/RN1Q1RK1 w - - 1 10',
      'r2q1rk1/ppp2pbp/2n1pnp1/3p4/2P2P2/1PN3P1/PB1P1PBP/R2Q1RK1 b - - 2 10',
      'r2q1rk1/ppp2pbp/2n1pnp1/8/2p2P2/1PN3P1/PB1P1PBP/R2Q1RK1 w - - 0 11',
      'r2q1rk1/ppp2pbp/2n1pnp1/8/2P2P2/2N3P1/PB1P1PBP/R2Q1RK1 b - - 0 11',
      'r4rk1/ppp2pbp/2n1pnp1/8/2P2P2/2Nq2P1/PB1P1PBP/R2Q1RK1 w - - 1 12',
      'r4rk1/ppp2pbp/2n1pnp1/8/2P2P2/2Nq2P1/PB1P1PBP/R2QR1K1 b - - 2 12',
      'r2r2k1/ppp2pbp/2n1pnp1/8/2P2P2/2Nq2P1/PB1P1PBP/R2QR1K1 w - - 3 13',
      'r2r2k1/ppp2pbp/2n1pnp1/1N6/2P2P2/3q2P1/PB1P1PBP/R2QR1K1 b - - 4 13',
      'r2r2k1/ppp2pbp/2n1pnp1/1N6/2q2P2/6P1/PB1P1PBP/R2QR1K1 w - - 0 14',
      'r2r2k1/ppp2pbp/2n1pnp1/1N6/P1q2P2/6P1/1B1P1PBP/R2QR1K1 b - a3 0 14',
      'r2r2k1/1pp2pbp/p1n1pnp1/1N6/P1q2P2/6P1/1B1P1PBP/R2QR1K1 w - - 0 15',
    ]

    register(game)
    register(game)

    for (const mv of moves) {
      const [source, target] = parseFENMove(mv)

      expect(() => move(game, mv)).not.toThrow()
      expect(game.history).toHaveLength(index + 1)
      expect(game.history[index]).toEqual({ source, target })
      expect(game.board).toEqual(decode(fen[index]))

      index += 1
    }
  })

  it('allows only valid castling', () => {
    validateMove(
      'r3k2r/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2P1/PPPQ1N2/R3KB1R b KQkq - 0 14',
      '2kr3r/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2P1/PPPQ1N2/R3KB1R w KQ - 1 15',
      'e8c8'
    )

    validateMove(
      '1k1r3r/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2PB/PPPQ1N2/R3K2R w KQ - 3 16',
      '1k1r3r/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2PB/PPPQ1N2/R4RK1 b - - 4 16',
      'e1g1'
    )

    validateMove(
      '2kr3r/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2P1/PPPQ1N2/R3KB1R w KQ - 1 15',
      '2kr3r/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2P1/PPPQ1N2/R3KB1R w KQ - 1 15',
      'e1g1',
      { ruleViolation: true }
    )

    validateMove(
      'r3k2r/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2P1/PPPQ1N2/R3KB1R b KQkq - 0 14',
      'r3k1r1/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2P1/PPPQ1N2/R3KB1R w KQq - 1 15',
      'h8g8'
    )

    validateMove(
      'r3k1r1/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2PB/PPPQ1N2/R3K2R b KQq - 2 15',
      'r3k1r1/ppqn1pp1/2p2n2/4p2p/3pPP1P/3P2PB/PPPQ1N2/R3K2R b KQq - 2 15',
      'e8g8',
      { ruleViolation: true }
    )

    validateMove(
      'r3k1r1/1pqn1p2/p1p2np1/4p2p/3pPP1P/3P2PB/PPPQ1N2/1R2K2R w Kq - 0 17',
      'r3k1r1/1pqn1p2/p1p2np1/4p2p/3pPP1P/3P2PB/PPPQ1N2/1R2K2R w Kq - 0 17',
      'e1c1',
      { ruleViolation: true }
    )

    validateMove(
      'r3k1r1/ppqn1p2/2p2np1/4p2p/3pPP1P/3P2PB/PPPQ1N2/R3K2R w KQq - 0 16',
      'r3k1r1/ppqn1p2/2p2np1/4p2p/3pPP1P/3P2PB/PPPQ1N2/1R2K2R b Kq - 1 16',
      'a1b1'
    )

    validateMove(
      'r3k1r1/ppqn1p2/5np1/2p1p2p/3pPP1P/3P2PB/PPPQ1N2/1R2K2R w Kq - 0 17',
      'r3k1r1/ppqn1p2/5np1/2p1p2p/3pPP1P/3P2PB/PPPQ1N1R/1R2K3 b q - 1 17',
      'h1h2'
    )
  })

  it('performs time control', () => {
    const game = create(1)

    register(game)
    register(game)

    game.lastRequest = Date.now() - 2

    expect(() => move(game, 'a2a3')).not.toThrow()
    expect(game.state).toBe('expired')
    expect(game.reason).toBe('time')
    expect(game.winner).toBe('black')
    expect(() => move(game, 'a2a3')).toThrow()
  })

  it('allows nullmoves', () => {
    const game = create(1000)

    register(game)
    register(game)

    validateMove(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 1 1',
      '0000'
    )

    validateMove(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 1 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 2 2',
      '0000'
    )

    validateMove(
      '8/1k1Q4/2p5/p1p5/P1Pp4/1P1P4/7P/6K1 b - - 4 47',
      '8/1k1Q4/2p5/p1p5/P1Pp4/1P1P4/7P/6K1 b - - 4 47',
      '0000',
      { ruleViolation: true }
    )
  })

  it('detects game ending positions', () => {
    const endings: [string, string, string, Color | 'draw', GameResult][] = [
      [
        '6Q1/p7/1p2B1p1/6Pk/2P2P2/1P6/1q6/1b4K1 w - - 1 46',
        '8/p6Q/1p2B1p1/6Pk/2P2P2/1P6/1q6/1b4K1 b - - 2 46',
        'g8h7',
        'white',
        'checkmate',
      ],
      [
        '8/2p5/1pR2pk1/pP2P1p1/P2P3q/8/3p2R1/6K1 b - - 0 56',
        '8/2p5/1pR2pk1/pP2P1p1/P2P3q/8/6R1/3q2K1 w - - 0 57',
        'd2d1q',
        'black',
        'checkmate',
      ],
      [
        '8/8/8/8/8/1kr4R/1p6/1K6 b - - 3 166',
        '8/8/8/8/8/1k5r/1p6/1K6 w - - 0 167',
        'c3h3',
        'draw',
        'stalemate',
      ],
    ]

    for (const mate of endings) {
      const start = decode(mate[0])
      const expected = decode(mate[1])
      const mv = mate[2]
      const game = create(1000)

      register(game)
      register(game)

      game.board = start

      expect(() => move(game, mv)).not.toThrow()
      expect(game.state).toBe('expired')
      expect(game.reason).toBe(mate[4])
      expect(game.winner).toBe(mate[3])
      expect(game.board).toEqual(expected)
    }
  })
})
