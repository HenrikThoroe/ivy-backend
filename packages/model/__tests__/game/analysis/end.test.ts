import { gameResult } from '../../../src/game/analysis/end'
import { decode } from '../../../src/game/model/Board'

describe('Game End Analysis', () => {
  it('finds checkmates', () => {
    const fens = [
      'rn1q1r2/1b4p1/p3Qk2/1pbn2N1/8/8/PP3PPP/RNB2RK1 b - - 0 17',
      '8/7R/8/8/5K2/7k/6p1/8 b - - 1 117',
      '7r/3k1p2/1pp1nK2/p2pP3/P2P1r2/1NR5/1P3P2/2R5 w - - 3 37',
      'Q7/1Q6/1kp5/p1p5/P1Pp4/1P1P4/8/6K1 b - - 4 54',
      '6k1/2b2p2/6p1/8/8/8/q7/1r1K4 w - - 10 58',
      '3kR3/1K6/8/pBp2P2/3b4/rp1P4/8/8 b - - 4 60',
      '8/4kp2/2p1p3/1pNpb3/1P4P1/P4Q2/R1R3Kr/2q2B1r w - - 4 40',
      '5rk1/2p5/p1bp2P1/2p5/2P5/1PQ3R1/P6P/2N3Kq w - - 5 45',
      '6Q1/5p2/4n3/1P5p/3b4/6Pk/8/5r1K w - - 6 56',
      '8/p6Q/1p2B1p1/6Pk/2P2P2/1P6/1q6/1b4K1 b - - 2 46',
      '8/2p5/1pR2pk1/pP2P1p1/P2P3q/8/6R1/3q2K1 w - - 0 57',
      '2r3r1/pB3p2/k3bB2/8/1Q6/P3PP2/q5PP/3R2K1 b - - 2 34',
      '4r3/1pp2p1k/3pNb1p/3PPPpP/2P5/qp6/2rQ4/1BKR2R1 w - - 1 36',
      '7Q/8/6pk/1P3p1p/7P/3P2P1/4nPBK/4q3 b - - 4 47',
      '7Q/kpR5/2p5/8/2KP4/8/Prq5/8 w - - 1 49',
    ]

    fens.forEach((fen) => expect(gameResult(decode(fen))).toBe('checkmate'))
  })

  it('finds stalemates', () => {
    const fens = [
      '8/8/8/8/1n2b3/1k6/8/K7 w - - 36 100',
      '2k5/2P5/2K5/8/8/8/8/8 b - - 2 71',
      '7K/7P/8/5k2/6r1/8/8/8 w - - 1 47',
      '8/8/8/8/8/4k3/4p3/4K3 w - - 2 99',
      '5k2/5P2/5K2/8/8/8/8/8 b - - 2 116',
      '1R6/k1P5/p7/P7/1P6/8/5K2/8 b - - 0 109',
      '7k/4PQ2/8/8/8/7N/6K1/8 b - - 0 63',
      '5k2/5P1p/5K1P/8/8/8/8/8 b - - 2 62',
      '7k/7P/6K1/6B1/8/8/8/8 b - - 0 84',
    ]

    fens.forEach((fen) => expect(gameResult(decode(fen))).toBe('stalemate'))
  })

  it('does not mistake a position for a mate', () => {
    const fens = [
      'r3r1k1/pp4p1/2nb4/1B1p4/3P2K1/2N5/PP2N1q1/R1BQ4 w - - 1 22',
      '5k2/2p2p2/5QNp/2pq2p1/rP6/7P/5PPK/8 b - - 1 35',
      '8/2r3k1/P2R2Pp/4n3/8/5b2/2r2p2/R2K1B2 w - - 2 46',
      'Q7/5pk1/2p1p1p1/7p/3Q1P1P/5PPK/8/3Bq3 b - - 0 52',
      '2k5/3nP3/4Kn2/P1pP4/2P5/7p/8/8 w - - 0 59',
      '8/8/6R1/5p2/6rk/5K2/8/8 w - - 4 40',
      '1k5r/1pp4P/8/2b1pN2/1n1pP3/3P3R/p2B3K/8 w - - 1 52',
      '8/p1p5/3r2pp/4k3/2Bb4/1P1Rp3/P1r3PP/3RK3 w - - 0 39',
      '4k3/8/P5p1/1P3p1p/2n5/6P1/2P1r3/2KR1B2 b - - 6 37',
      '1R6/3N1pk1/2p4p/B2b2p1/P2b1p1P/8/5rP1/7K w - - 2 35',
    ]

    fens.forEach((fen) => expect(gameResult(decode(fen))).toBe(undefined))
  })

  it('detects 50 move draw', () => {
    expect(gameResult(decode('8/8/8/8/7R/1K2k3/3r4/8 b - - 100 118'))).toBe('50-move-draw')
    expect(gameResult(decode('8/8/8/8/5R2/1K2k3/3r4/8 w - - 99 118'))).toBe(undefined)
  })
})
