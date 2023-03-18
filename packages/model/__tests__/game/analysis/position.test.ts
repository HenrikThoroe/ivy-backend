import { next, scanAxis, scanDiagonal } from '../../../src/game/analysis/position'
import { decode } from '../../../src/game/model/Board'

describe('Position Analysis', () => {
  describe('Scan Axis', () => {
    it('finds all positions on the rank', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const board = decode(fen)
      const hf = Array.from(scanAxis(board, 27, 'horizontal', 'forward'))
      const hb = Array.from(scanAxis(board, 27, 'horizontal', 'backward'))

      expect(hf).toHaveLength(4)
      expect(hb).toHaveLength(3)
      expect(hf.map((r) => r.index)).toEqual([28, 29, 30, 31])
      expect(hb.map((r) => r.index)).toEqual([26, 25, 24])
      expect(hf.map((r) => r.distance)).toEqual([1, 2, 3, 4])
      expect(hb.map((r) => r.distance)).toEqual([1, 2, 3])
    })

    it('finds all positions on the file', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const board = decode(fen)
      const hf = Array.from(scanAxis(board, 27, 'vertical', 'forward'))
      const hb = Array.from(scanAxis(board, 27, 'vertical', 'backward'))

      expect(hf).toHaveLength(4)
      expect(hb).toHaveLength(3)
      expect(hf.map((r) => r.index)).toEqual([27 + 8, 27 + 16, 27 + 24, 27 + 32])
      expect(hb.map((r) => r.index)).toEqual([27 - 8, 27 - 16, 27 - 24])
      expect(hf.map((r) => r.distance)).toEqual([1, 2, 3, 4])
      expect(hb.map((r) => r.distance)).toEqual([1, 2, 3])
    })
  })

  describe('Scan Diagonal', () => {
    it('finds all positions on the descending diagonal', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const board = decode(fen)
      const hf = Array.from(scanDiagonal(board, 27, 'descending', 'forward'))
      const hb = Array.from(scanDiagonal(board, 27, 'descending', 'backward'))

      expect(hf).toHaveLength(4)
      expect(hb).toHaveLength(3)
      expect(hf.map((r) => r.index)).toEqual([27 + 9, 27 + 18, 27 + 27, 27 + 36])
      expect(hb.map((r) => r.index)).toEqual([27 - 9, 27 - 18, 27 - 27])
      expect(hf.map((r) => r.distance)).toEqual([1, 2, 3, 4])
      expect(hb.map((r) => r.distance)).toEqual([1, 2, 3])
    })

    it('finds all positions on the ascending diagonal', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const board = decode(fen)
      const hf = Array.from(scanDiagonal(board, 27, 'ascending', 'forward'))
      const hb = Array.from(scanDiagonal(board, 27, 'ascending', 'backward'))

      expect(hf).toHaveLength(3)
      expect(hb).toHaveLength(3)
      expect(hf.map((r) => r.index)).toEqual([27 - 7, 27 - 14, 27 - 21])
      expect(hb.map((r) => r.index)).toEqual([27 + 7, 27 + 14, 27 + 21])
      expect(hf.map((r) => r.distance)).toEqual([1, 2, 3])
      expect(hb.map((r) => r.distance)).toEqual([1, 2, 3])
    })
  })

  describe('Next Piece', () => {
    it('finds enemy pieces on diagonal', () => {
      const fen = 'rnb1kbnr/pp1p1ppp/2p5/4pQ2/3P4/4P2q/PPP2PPP/RNB1KBNR w KQkq - 1 5'
      const board = decode(fen)

      expect(next(board, 'white', 29, 9, 'diagonal').index).toBe(47)
      expect(next(board, 'white', 29, 9, 'diagonal').distance).toBe(2)

      expect(next(board, 'white', 29, -9, 'diagonal').index).toBe(11)
      expect(next(board, 'white', 29, -9, 'diagonal').distance).toBe(2)

      expect(next(board, 'white', 29, -7, 'diagonal').index).toBe(15)
      expect(next(board, 'white', 29, -7, 'diagonal').distance).toBe(2)

      expect(next(board, 'white', 29, 7, 'diagonal').index).toBe(-1)
      expect(next(board, 'white', 29, 7, 'diagonal').distance).toBe(-1)
    })

    it('finds enemy pieces on rank and file', () => {
      const fen = 'rnb1kbnr/pp1p1ppp/2p5/4pQ2/3P4/4P2q/PPP2PPP/RNB1KBNR w KQkq - 1 5'
      const board = decode(fen)

      expect(next(board, 'white', 29, 1, 'rank').index).toBe(-1)
      expect(next(board, 'white', 29, 1, 'rank').distance).toBe(-1)

      expect(next(board, 'white', 29, -1, 'rank').index).toBe(28)
      expect(next(board, 'white', 29, -1, 'rank').distance).toBe(1)

      expect(next(board, 'white', 29, -8, 'file').index).toBe(13)
      expect(next(board, 'white', 29, -8, 'file').distance).toBe(2)

      expect(next(board, 'white', 29, 8, 'file').index).toBe(-1)
      expect(next(board, 'white', 29, 8, 'file').distance).toBe(-1)
    })

    it('stops searching when getting to the board edge', () => {
      const fen = [
        'rnb1kbnr/p2p1pp1/2p4p/4pQ2/1p1P4/PPP1P2q/5PPP/RNB1KBNR w KQkq - 0 8',
        'rnb1kbnr/pp1p1ppp/2p2Q2/4pq2/3P4/4P3/PPP2PPP/RNB1KBNR w KQkq - 3 6',
      ]
      const board = fen.map((f) => decode(f))

      expect(next(board[0], 'white', 29, 1, 'rank').index).toBe(-1)
      expect(next(board[0], 'white', 29, 1, 'rank').distance).toBe(-1)

      expect(next(board[0], 'white', 29, -7, 'diagonal').index).toBe(-1)
      expect(next(board[0], 'white', 29, -7, 'diagonal').distance).toBe(-1)

      expect(next(board[1], 'black', 29, 9, 'diagonal').index).toBe(-1)
      expect(next(board[1], 'black', 1, -9, 'diagonal').index).toBe(-1)
    })
  })
})
