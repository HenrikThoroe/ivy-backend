import { decode, Board } from '../../../src/game/model/Board'

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
})
