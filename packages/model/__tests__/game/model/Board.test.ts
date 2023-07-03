import { decode, Board, encode } from '../../../src/game/model/Board'

describe('Chess Board', () => {
  describe('Load from FEN string', () => {
    it('requires a valid fen game description', () => {
      const valid = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq a6 0 1'

      expect(() => decode(valid)).not.toThrow()
      expect(() => decode('')).toThrow()
      expect(() => decode(valid.replaceAll(' ', ''))).toThrow()
      expect(decode(valid).enPassant).toBe(16)
    })

    it('accepts - as unavailable En Pássant', () => {
      const valid = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

      expect(decode(valid).enPassant).toBe(undefined)
    })

    it('rejects invalid En Pássant', () => {
      const invalid = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq a 0 1'

      expect(() => decode(invalid)).toThrow()
      expect(() => decode(invalid.replace('a', 'i9'))).toThrow()
    })

    it('rejects negative or floating point counter', () => {
      const invalid = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1',
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0.8',
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 -9',
      ]

      invalid.forEach((i) => expect(() => decode(i)).toThrow())
    })
  })
  describe('Encode to FEN', () => {
    it('encodes valid positions', () => {
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

      for (const str of fen) {
        const board = decode(str)
        const encoded = encode(board)

        expect(encoded).toEqual(str)
      }
    })
  })
})
