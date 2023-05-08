import { isValidMove, moves, movesWithReplacement } from '../../../src/game/analysis/moves'
import { decode, Piece, PieceType } from '../../../src/game/model/Board'

describe('Move Analysis', () => {
  describe('Move Calculation', () => {
    it('finds pawn moves', () => {
      const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
      const board = decode(fen)
      const found = [
        moves(board, 27),
        moves(board, 8),
        moves(board, 31),
        moves(board, 47),
        moves(board, 54),
      ]

      expect(found[0]).toHaveLength(1)
      expect(found[0]).toContain(35)

      expect(found[1]).toHaveLength(2)
      expect(found[1]).toContain(16)
      expect(found[1]).toContain(24)

      expect(found[2]).toHaveLength(1)
      expect(found[2]).toContain(39)

      expect(found[3]).toHaveLength(2)
      expect(found[3]).toContain(39)
      expect(found[3]).toContain(38)

      expect(found[4]).toHaveLength(1)
      expect(found[4]).toContain(46)
    })

    it('finds en pássant', () => {
      const fen = 'r1br2k1/1p2Qpp1/1q6/pP1p1P1p/6n1/3P1N1P/PB1P2P1/4RR1K w - a6 0 23'
      const board = decode(fen)
      const pawnMoves = moves(board, 25)

      expect(pawnMoves).toHaveLength(1)
      expect(pawnMoves).toContain(16)
    })

    it('finds rook moves', () => {
      const fen = 'r1br2k1/1p2Qpp1/1q6/pP1p1P1p/6n1/3P1N1P/PB1P2P1/4RR1K w - a6 0 23'
      const takingFen = 'r1b1r1k1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K w - - 1 21'
      const board = decode(fen)
      const rookMoves = moves(board, 60)
      const takingRook = moves(decode(takingFen), 4)

      expect(rookMoves).toHaveLength(9)
      expect(rookMoves).toContain(59)
      expect(rookMoves).toContain(58)
      expect(rookMoves).toContain(57)
      expect(rookMoves).toContain(56)

      expect(rookMoves).toContain(52)
      expect(rookMoves).toContain(44)
      expect(rookMoves).toContain(36)
      expect(rookMoves).toContain(28)
      expect(rookMoves).toContain(20)

      expect(takingRook).toHaveLength(3)
      expect(takingRook).toContain(3)
      expect(takingRook).toContain(5)
      expect(takingRook).toContain(12)
    })

    it('finds bishop moves', () => {
      const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
      const board = decode(fen)
      const found = moves(board, 49)

      expect(found).toHaveLength(8)
      expect(found).toContain(56)
      expect(found).toContain(58)
      expect(found).toContain(40)
      expect(found).toContain(42)
      expect(found).toContain(14)
    })

    it('finds queen moves', () => {
      const fen = 'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20'
      const board = decode(fen)
      const found = moves(board, 17)

      expect(found).toHaveLength(18)
    })

    it('finds king moves', () => {
      const fen = [
        'r1b2rk1/pp2Qpp1/1q6/3p1P1p/6n1/1P1P1N1P/PB1P2P1/4RR1K b - - 0 20',
        'r3k2r/2pbq1bN/1pnp2pn/pB2pp2/3PP2B/NQP5/PP3PPP/R4RK1 b kq - 0 14',
        'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10',
      ]
      const endgameBoard = decode(fen[0])
      const castlingBoard = decode(fen[1])
      const castlingBoard2 = decode(fen[2])
      const found = [
        moves(endgameBoard, 6),
        moves(endgameBoard, 63),
        moves(castlingBoard, 4),
        moves(castlingBoard2, 4),
      ]

      expect(found[0]).toHaveLength(2)
      expect(found[0]).toContain(7)
      expect(found[0]).toContain(15)

      expect(found[1]).toHaveLength(0)

      expect(found[2]).toHaveLength(2)
      expect(found[2]).toContain(3)
      expect(found[2]).toContain(2)

      expect(found[3]).toHaveLength(5)
      expect(found[3]).toContain(3)
      expect(found[3]).toContain(2)
      expect(found[3]).toContain(5)
      expect(found[3]).toContain(6)
      expect(found[3]).toContain(13)
    })

    it('throws when a position has no piece', () => {
      const fen = 'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10'
      const board = decode(fen)

      expect(() => moves(board, 1)).toThrow()
    })
  })

  describe('Board Modification', () => {
    it('resets the board after adding piece', () => {
      const fen = 'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10'
      const board = decode(fen)
      const found = movesWithReplacement(board, 26, { color: 'black', type: 'pawn' })

      expect(found).toHaveLength(2)
      expect(found).toContain(34)
      expect(found).toContain(35)

      expect(board.positions[26].piece).toBe(undefined)
    })

    it('resets the board after replacing piece', () => {
      const fen = 'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10'
      const board = decode(fen)
      const found = movesWithReplacement(board, 25, { color: 'black', type: 'knight' })

      expect(found).toHaveLength(3)
      expect(found).toContain(35)
      expect(found).toContain(42)
      expect(found).toContain(40)

      expect(board.positions[25].piece).toEqual({ color: 'white', type: 'bishop' })
    })

    it('resets the board after exception', () => {
      const fen = 'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10'
      const board = decode(fen)
      const invalidPiece: Piece = { color: 'black', type: 'night' as PieceType }

      expect(() => movesWithReplacement(board, 25, invalidPiece)).toThrow()
      expect(board.positions[25].piece).toEqual({ color: 'white', type: 'bishop' })
    })
  })

  describe('Move Validation', () => {
    it('rejects when no piece is on given position', () => {
      const fen = 'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10'
      const board = decode(fen)

      expect(isValidMove(board, 26, 34)).toBe(false)
    })

    it('rejects when piece has wrong color', () => {
      const fen = 'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10'
      const board = decode(fen)

      expect(isValidMove(board, 8, 16)).toBe(false)
    })

    it('rejects move that would allow a check on the own king', () => {
      const fen = '5r2/ppp2kbp/3n2p1/3p4/3P4/2PB4/PP2R1PP/5NK1 b - - 2 27'
      const board = decode(fen)

      expect(isValidMove(board, 13, 12)).toBe(false)
      expect(isValidMove(board, 13, 20)).toBe(false)
    })

    it('rejects move that opens up a hidden check', () => {
      const fen = '5r2/ppp3kp/3n2p1/3p4/3P4/2PBb3/PP3RPP/6K1 w - - 2 30'
      const board = decode(fen)

      expect(isValidMove(board, 53, 52)).toBe(false)
      expect(isValidMove(board, 53, 45)).toBe(false)
      expect(isValidMove(board, 53, 61)).toBe(false)
    })

    it('rejects move that leaves a check for the own king', () => {
      const fen = '5r2/ppp2k1p/3n2p1/3p4/3P4/2PBb3/PP2R1PP/6K1 w - - 0 29'
      const board = decode(fen)

      expect(isValidMove(board, 52, 44)).toBe(true)
      expect(isValidMove(board, 52, 53)).toBe(true)
      expect(isValidMove(board, 52, 60)).toBe(false)
    })

    it('does not modify the board', () => {
      const fen = 'r3k2r/pppbq1bp/2np1ppn/1B2p3/3PP2B/N1P2N2/PP3PPP/R2Q1RK1 w kq - 4 10'
      const board = decode(fen)

      expect(() => isValidMove(board, 62, 63)).not.toThrow()
      expect(board).toEqual(decode(fen))
    })
  })
})
