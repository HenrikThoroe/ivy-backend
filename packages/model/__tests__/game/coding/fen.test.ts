import {
  parseFENBoard,
  parseFENCastle,
  parseFENColor,
  parseFENMove,
  parseFENPiece,
  parseFENTarget,
} from '../../../src/game/coding/fen_parsing'
import { Position } from '../../../src/game/model/Board'

describe('FEN', () => {
  describe('Parse FEN target', () => {
    it('throws when invalid encoding is given', () => {
      const moves = ['-', 'abcd', 'g3h6', 'a9', 'i8', 'xeebu', '%$', 'A7']

      moves.forEach((move) =>
        expect(() => parseFENTarget(move)).toThrowError(`The move code has to be a valid position.`)
      )
    })

    it('assigns index 0 to a8', () => {
      expect(parseFENTarget('a8')).toBe(0)
    })

    it('assigns index 63 to h1', () => {
      expect(parseFENTarget('h1')).toBe(63)
    })

    it('calculates the right indecies for board positions', () => {
      expect(parseFENTarget('g6')).toBe(22)
      expect(parseFENTarget('c6')).toBe(18)
      expect(parseFENTarget('f4')).toBe(37)
      expect(parseFENTarget('a1')).toBe(56)
      expect(parseFENTarget('h8')).toBe(7)
      expect(parseFENTarget('e1')).toBe(60)
    })
  })

  describe('Parse FEN move', () => {
    it('accepts UCI nullmove encoding', () => {
      expect(parseFENMove('0000')).toBe('nullmove')
    })

    it('requires a four digit encoding', () => {
      expect(() => parseFENMove('0000')).not.toThrow()
      expect(() => parseFENMove('a1a1')).not.toThrow()
      expect(() => parseFENMove('a1a1h')).toThrow()
      expect(() => parseFENMove('a1a1h1')).toThrow()
    })

    it('decodes valid target pairs', () => {
      expect(parseFENMove('a1a1')).toStrictEqual([56, 56])
      expect(parseFENMove('a1e1')).toStrictEqual([56, 60])
      expect(parseFENMove('a8h1')).toStrictEqual([0, 63])
    })
  })

  describe('Parse FEN piece', () => {
    it('throws on unknown encodings', () => {
      expect(() => parseFENPiece('a1')).toThrow()
      expect(() => parseFENPiece('w')).toThrow()
      expect(() => parseFENPiece('pawn')).toThrow()
    })

    it('determines the right piece type', () => {
      expect(parseFENPiece('p').type).toBe('pawn')
      expect(parseFENPiece('B').type).toBe('bishop')
      expect(parseFENPiece('Q').type).toBe('queen')
      expect(parseFENPiece('n').type).toBe('knight')
      expect(parseFENPiece('k').type).toBe('king')
      expect(parseFENPiece('R').type).toBe('rook')
    })

    it('interprets uppercase as white and lowercase as black', () => {
      expect(parseFENPiece('p').color).toBe('black')
      expect(parseFENPiece('P').color).toBe('white')
    })
  })

  describe('Parse FEN color', () => {
    it('accepts only w for white and b for black', () => {
      expect(parseFENColor('w')).toBe('white')
      expect(parseFENColor('b')).toBe('black')
      expect(() => parseFENColor('W')).toThrow()
      expect(() => parseFENColor('B')).toThrow()
      expect(() => parseFENColor('foo')).toThrow()
      expect(() => parseFENColor('white')).toThrow()
      expect(() => parseFENColor('black')).toThrow()
    })
  })

  describe('Parse FEN castle', () => {
    it('accepts - for no castle', () => {
      expect(parseFENCastle('-').white).toBe('none')
      expect(parseFENCastle('-').black).toBe('none')
    })

    it('rejects unknown encodings', () => {
      expect(() => parseFENCastle('e')).toThrow()
      expect(() => parseFENCastle('Kqa')).toThrow()
      expect(() => parseFENCastle('Ko')).toThrow()
      expect(() => parseFENCastle('Aq')).toThrow()
    })

    it('decodes queen and king side castle', () => {
      expect(parseFENCastle('q').black).toBe('queen-side')
      expect(parseFENCastle('q').white).toBe('none')

      expect(parseFENCastle('Q').black).toBe('none')
      expect(parseFENCastle('Q').white).toBe('queen-side')

      expect(parseFENCastle('k').black).toBe('king-side')
      expect(parseFENCastle('k').white).toBe('none')

      expect(parseFENCastle('K').black).toBe('none')
      expect(parseFENCastle('K').white).toBe('king-side')
    })

    it('decodes both side castle', () => {
      expect(parseFENCastle('qk').black).toBe('both')
      expect(parseFENCastle('qk').white).toBe('none')

      expect(parseFENCastle('QK').black).toBe('none')
      expect(parseFENCastle('QK').white).toBe('both')
    })

    it('decodes castle for both players', () => {
      expect(parseFENCastle('QKqk').black).toBe('both')
      expect(parseFENCastle('QKqk').white).toBe('both')

      expect(parseFENCastle('Kk').black).toBe('king-side')
      expect(parseFENCastle('Kk').white).toBe('king-side')

      expect(parseFENCastle('Qq').black).toBe('queen-side')
      expect(parseFENCastle('Qq').white).toBe('queen-side')

      expect(parseFENCastle('Qk').black).toBe('king-side')
      expect(parseFENCastle('Kq').white).toBe('king-side')
    })

    it('requires white to be declared before black', () => {
      expect(() => parseFENCastle('kQ').black).toThrow()
      expect(() => parseFENCastle('kqQ').black).toThrow()
      expect(() => parseFENCastle('QkK').black).toThrow()
    })

    it('throws on double declarations', () => {
      expect(() => parseFENCastle('kk').black).toThrow()
      expect(() => parseFENCastle('qq').black).toThrow()
      expect(() => parseFENCastle('Qkk').black).toThrow()
    })
  })

  describe('Parse FEN board', () => {
    it(`parses standard chess opening board`, () => {
      const board = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
      type IndexedPosition = { index: number } & Position
      const positions: IndexedPosition[] = [
        {
          index: 0,
          column: 1,
          row: 8,
          color: 'white',
          piece: {
            type: 'rook',
            color: 'black',
          },
        },
        {
          index: 3,
          column: 4,
          row: 8,
          color: 'black',
          piece: {
            type: 'queen',
            color: 'black',
          },
        },
        {
          index: 8,
          column: 1,
          row: 7,
          color: 'black',
          piece: {
            type: 'pawn',
            color: 'black',
          },
        },
        {
          index: 18,
          column: 3,
          row: 6,
          color: 'white',
        },
        {
          index: 60,
          column: 5,
          row: 1,
          color: 'black',
          piece: {
            type: 'king',
            color: 'white',
          },
        },
      ]

      expect(() => parseFENBoard(board)).not.toThrow()
      expect(parseFENBoard(board)).toHaveLength(64)

      for (const pos of positions) {
        expect(parseFENBoard(board)[pos.index].row).toBe(pos.row)
        expect(parseFENBoard(board)[pos.index].column).toBe(pos.column)
        expect(parseFENBoard(board)[pos.index].color).toBe(pos.color)
        expect(parseFENBoard(board)[pos.index].piece?.color).toBe(pos.piece?.color)
        expect(parseFENBoard(board)[pos.index].piece?.type).toBe(pos.piece?.type)
      }
    })

    it('fails when a row separator is missing', () => {
      expect(() => parseFENBoard('88/8/8/8/8/8/8')).toThrow()
      expect(() => parseFENBoard('8/8/8/8/8/8/8/8')).not.toThrow()
    })

    it('fails when a row does not declare 8 columns', () => {
      expect(() => parseFENBoard('8/8/7/8/8/8/8/8')).toThrow()
      expect(() => parseFENBoard('8/8/9/8/8/8/8/8')).toThrow()
      expect(() => parseFENBoard('8/ppppppppQ/8/8/8/8/8/8')).toThrow()
      expect(() => parseFENBoard('8/ppp2pppp/8/8/8/8/8/8')).toThrow()
    })
  })
})
