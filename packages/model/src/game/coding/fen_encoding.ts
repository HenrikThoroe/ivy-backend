import { Board, CastleRights, PieceType } from '../model/Board'
import { Move } from '../model/Game'

const fenPieceMapping: Map<PieceType, string> = new Map([
  ['rook', 'r'],
  ['bishop', 'b'],
  ['knight', 'n'],
  ['queen', 'q'],
  ['king', 'k'],
  ['pawn', 'p'],
])

function encodeCastleRights(rights: CastleRights) {
  if (rights === 'queen-side') {
    return 'q'
  }

  if (rights === 'king-side') {
    return 'k'
  }

  if (rights === 'both') {
    return 'kq'
  }

  return '-'
}

/**
 * Encode the board positions as a FEN string.
 *
 * @param board The board to encode.
 * @returns The FEN string.
 */
export function encodeFENPositions(board: Board) {
  const base = board.positions.map((pos) => {
    if (pos.piece) {
      const id = fenPieceMapping.get(pos.piece.type)!

      if (pos.piece.color === 'white') {
        return id.toUpperCase()
      }

      return id
    }

    return '0'
  })

  const rows: string[] = []

  while (base.length > 0) {
    let row = base.splice(0, 8).join('')

    for (let i = 8; i > 0; i--) {
      const pattern = '0'.repeat(i)
      row = row.replaceAll(pattern, i.toString())
    }

    rows.push(row)
  }

  return rows.join('/')
}

/**
 * Encode the castle rights as a FEN string.
 *
 * @param board The board to encode.
 * @returns The FEN string.
 */
export function encodeFENCastle(board: Board) {
  if (board.castleRights.white === 'none' && board.castleRights.black === 'none') {
    return '-'
  }

  let fen = ''

  fen += encodeCastleRights(board.castleRights.white).toUpperCase()
  fen += encodeCastleRights(board.castleRights.black)

  return fen.replaceAll('-', '')
}

/**
 * Encode the en passant target as a FEN string.
 *
 * @param board The board to encode.
 * @returns The FEN string.
 */
export function encodeFENEnPassant(board: Board) {
  if (board.enPassant === undefined) {
    return '-'
  }

  const row = Math.floor(board.enPassant / 8)
  const column = board.enPassant % 8

  return `${String.fromCharCode(97 + column)}${8 - row}`
}

/**
 * Encode the half move counter as a FEN string.
 *
 * @param board The board to encode.
 * @returns The FEN string.
 */
export function encodeFENHalfMoves(board: Board) {
  return board.halfMoveCounter.toString()
}

/**
 * Encode the full move counter as a FEN string.
 *
 * @param board The board to encode.
 * @returns The FEN string.
 */
export function encodeFENFullMoves(board: Board) {
  return board.fullMoveCounter.toString()
}

/**
 * Encodes a player color as a FEN string.
 *
 * @param board The board to encode.
 * @returns The FEN string.
 */
export function encodeFENColor(board: Board) {
  return board.next === 'white' ? 'w' : 'b'
}

/**
 * Encodes a board as a FEN string.
 *
 * @param board The board to encode.
 * @returns The FEN string.
 */
export function encodeFEN(board: Board) {
  return [
    encodeFENPositions(board),
    encodeFENColor(board),
    encodeFENCastle(board),
    encodeFENEnPassant(board),
    encodeFENHalfMoves(board),
    encodeFENFullMoves(board),
  ].join(' ')
}

/**
 * Encodes a move as a FEN string.
 * A move in FEN notation is in the format: a1b2(promotion?)
 *
 * @param move The move to encode.
 * @returns The FEN string.
 */
export function encodeMove(move: Move) {
  const encodeIdx = (idx: number) => {
    const row = idx % 8
    const col = Math.floor(idx / 8)

    return `${String.fromCharCode(97 + row)}${8 - col}`
  }

  const source = encodeIdx(move.source)
  const target = encodeIdx(move.target)
  let promotion = move.promotion ? fenPieceMapping.get(move.promotion.type) : undefined

  if (move.promotion && move.promotion.color === 'white') {
    promotion = promotion?.toUpperCase()
  }

  return `${source}${target}${promotion ?? ''}`
}
