import { Board, CastleRights, PieceType } from '../model/Board'

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

export function encodeFENCastle(board: Board) {
  if (board.castleRights.white === 'none' && board.castleRights.black === 'none') {
    return '-'
  }

  let fen = ''

  fen += encodeCastleRights(board.castleRights.white).toUpperCase()
  fen += encodeCastleRights(board.castleRights.black)

  return fen.replaceAll('-', '')
}

export function encodeFENEnPassant(board: Board) {
  if (board.enPassant === undefined) {
    return '-'
  }

  const row = Math.floor(board.enPassant / 8)
  const column = board.enPassant % 8

  return `${String.fromCharCode(97 + column)}${8 - row}`
}

export function encodeFENHalfMoves(board: Board) {
  return board.halfMoveCounter.toString()
}

export function encodeFENFullMoves(board: Board) {
  return board.fullMoveCounter.toString()
}

export function encodeFENColor(board: Board) {
  return board.next === 'white' ? 'w' : 'b'
}

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
