import { parseFENBoard, parseFENCastle, parseFENColor, parseFENTarget } from '../coding/fen'
import { Color, ColorMap } from './Game'

export type PieceType = 'rook' | 'bishop' | 'knight' | 'queen' | 'king' | 'pawn'

export interface Piece {
  type: PieceType
  color: Color
}

export interface Position {
  color: Color
  piece?: Piece
  row: number
  column: number
}

export type CastleRights = 'queen-side' | 'king-side' | 'none' | 'both'

export interface Board {
  positions: Position[]
  next: Color
  castleRights: ColorMap<CastleRights>
  enPassant?: number
  halfMoveCounter: number
  fullMoveCounter: number
}

export function hash(board: Board) {
  return board.positions
    .map((pos) => {
      if (pos.piece) {
        let id = pos.piece.type[0].toLowerCase()

        if (pos.piece.type === 'knight') {
          id = 'n'
        }

        if (pos.piece.color === 'black') {
          id = id.toUpperCase()
        }

        return id
      }

      return '0'
    })
    .join('')
}

export function decode(fen: string): Board {
  const components = fen.split(' ')
  const compCount = 6
  const isPositiveInteger = (num: number) => !Number.isNaN(num) && num >= 0 && Number.isInteger(num)

  if (components.length !== compCount) {
    throw new Error(`A FEN string has to contain 6 whitespace separated components.`)
  }

  const [boardFEN, colorFEN, castleFEN, enPassantFEN, halfMovesFEN, fullMovesFEN] = components
  const positions = parseFENBoard(boardFEN)
  let next = parseFENColor(colorFEN)
  let enPassant: number | undefined
  const halfMoveCounter = parseFloat(halfMovesFEN)
  const fullMoveCounter = parseFloat(fullMovesFEN)
  const castle = parseFENCastle(castleFEN)

  if (enPassantFEN !== '-') {
    enPassant = parseFENTarget(enPassantFEN)
  }

  if (!isPositiveInteger(halfMoveCounter) || !isPositiveInteger(fullMoveCounter)) {
    throw Error(`The half and full move counter have to be positive integers.`)
  }

  return {
    positions,
    next,
    castleRights: castle,
    halfMoveCounter,
    fullMoveCounter,
    enPassant,
  }
}
