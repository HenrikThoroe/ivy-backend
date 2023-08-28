import { encodeFEN } from '../coding/fen_encoding'
import { parseFENBoard, parseFENCastle, parseFENColor, parseFENTarget } from '../coding/fen_parsing'
import { Color, ColorMap } from './Game'

/**
 * Type of an individual piece.
 */
export type PieceType = 'rook' | 'bishop' | 'knight' | 'queen' | 'king' | 'pawn'

/**
 * A chess piece with a type and a color.
 */
export interface Piece {
  /**
   * The type of the piece.
   */
  type: PieceType

  /**
   * The color of the piece.
   */
  color: Color
}

/**
 * A position on the board.
 */
export interface Position {
  /**
   * The color of the position.
   */
  color: Color

  /**
   * The piece on the position, if any.
   */
  piece?: Piece

  /**
   * The rank of the position.
   */
  row: number

  /**
   * The file of the position.
   */
  column: number
}

/**
 * The castle rights for each color.
 */
export type CastleRights = 'queen-side' | 'king-side' | 'none' | 'both'

/**
 * The board of a chess game.
 * The board consists of 64 positions, each with a color and a piece.
 * The board also contains meta information similiar to the FEN notation.
 * The positions are indexed from 0 to 63, starting with the top left position.
 */
export interface Board {
  /**
   * The positions on the board.
   */
  positions: Position[]

  /**
   * The color of the next player to move.
   */
  next: Color

  /**
   * The castle rights for each color.
   */
  castleRights: ColorMap<CastleRights>

  /**
   * The index of the en passant target, if any.
   */
  enPassant?: number

  /**
   * The half move counter.
   */
  halfMoveCounter: number

  /**
   * The full move counter.
   */
  fullMoveCounter: number
}

/**
 * Returns a "hash" for a board.
 * The hash is a string uniquely identifying the current
 * board positions.
 *
 * @param board The board to hash.
 * @returns A hash string with fixes length of 64 characters.
 */
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

/**
 * Takes a FEN string and creates a {@link Board} instance.
 *
 * @param fen The FEN string.
 * @returns The board.
 * @throws An error if the FEN string is invalid.
 */
export function decode(fen: string): Board {
  const components = fen.split(' ')
  const compCount = 6
  const isPositiveInteger = (num: number) => !Number.isNaN(num) && num >= 0 && Number.isInteger(num)

  if (components.length !== compCount) {
    throw new Error(`A FEN string has to contain 6 whitespace separated components.`)
  }

  const [boardFEN, colorFEN, castleFEN, enPassantFEN, halfMovesFEN, fullMovesFEN] = components
  const positions = parseFENBoard(boardFEN)
  const next = parseFENColor(colorFEN)
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

/**
 * Takes a {@link Board} instance and creates a FEN string.
 *
 * @param board The board.
 * @returns The FEN string.
 */
export function encode(board: Board): string {
  return encodeFEN(board)
}
