import { CastleRights, Piece, PieceType, Position } from '../model/Board'
import { Color, ColorMap } from '../model/Game'

const fenPieceMapping: Map<string, PieceType> = new Map([
  ['r', 'rook'],
  ['b', 'bishop'],
  ['n', 'knight'],
  ['q', 'queen'],
  ['k', 'king'],
  ['p', 'pawn'],
])

/**
 * Takes a FEN encoded move string and parses the source and target
 * indecies. Accepts '0000' as a nullmove.
 *
 * @param move The FEN encoded move.
 * @returns The source and target index or 'nullmove' if the move is '0000'.
 */
export function parseFENMove(move: string): [number, number] | 'nullmove' {
  if (move.length !== 4) {
    throw Error(`A FEN move has to be encoded using 4 digits.`)
  }

  if (move === '0000') {
    return 'nullmove'
  }

  const source = parseFENTarget(move.substring(0, 2))
  const target = parseFENTarget(move.substring(2, 4))

  return [source, target]
}

/**
 * Parses a FEN encoded position aka 'rowcol' into an index.
 *
 * @param move The FEN encoded position.
 * @returns The index of the position.
 * @throws If the move is not a valid position.
 */
export function parseFENTarget(move: string): number {
  if (!/^[a-h]{1}[1-8]{1}$/.test(move)) {
    throw Error(`The move code has to be a valid position.`)
  }

  const maxIdx = 7
  const rowIdx = 1
  const colIdx = 0
  const rowOffset = 1
  const rows = 8
  const minCode = 'a'.charCodeAt(0)
  const col = move.charCodeAt(colIdx) - minCode
  const row = maxIdx - (parseInt(move.charAt(rowIdx)) - rowOffset)
  const index = row * rows + col

  return index
}

/**
 * Parses a FEN encoded piece.
 * A piece is encoded as a single character.
 * Lowercase characters represent black pieces, uppercase characters represent white pieces.
 *
 * @param char The FEN encoded piece.
 * @returns The piece.
 * @throws If the piece is not a valid FEN piece encoding.
 */
export function parseFENPiece(char: string): Piece {
  const normal = char.toLowerCase()
  const color: Color = normal === char ? 'black' : 'white'
  const type = fenPieceMapping.get(normal)

  if (type) {
    return { type, color }
  }

  throw Error(`${char} is not a valid FEN piece encoding.`)
}

/**
 * Converts a FEN encoded color to a color.
 *
 * @param fen The FEN encoded color (w or b)
 * @returns The color.
 * @throws If the color is not a valid FEN color encoding.
 */
export function parseFENColor(fen: string): Color {
  if (fen === 'w') {
    return 'white'
  } else if (fen === 'b') {
    return 'black'
  } else {
    throw Error(`Invalid FEN encoding for color.`)
  }
}

/**
 * Converts FEN encoded castle rights to `CastleRights`.
 *
 * @param fen The FEN encoded castle rights.
 * @returns The castle rights.
 * @throws If the castle rights are not a valid FEN castle rights encoding.
 */
export function parseFENCastle(fen: string): ColorMap<CastleRights> {
  const castle: ColorMap<CastleRights> = {
    white: 'none',
    black: 'none',
  }

  if (fen === '-') {
    return castle
  }

  let didParseBlack = false

  for (const char of fen) {
    const normal = char.toLowerCase()
    const color: Color = char === normal ? 'black' : 'white'

    if (normal !== 'q' && normal !== 'k') {
      throw Error(`Only king and queen side castling may be specified.`)
    }

    if (color === 'black') {
      didParseBlack = true
    }

    if (color === 'white' && didParseBlack) {
      throw Error(`Whites castle rights have to be declared before blacks castle rights.`)
    }

    if (normal === 'q' && castle[color] === 'queen-side') {
      throw Error(`Cannot redeclare queen side castle`)
    } else if (normal === 'k' && castle[color] === 'king-side') {
      throw Error(`Cannot redeclare king side castle`)
    } else if (normal === 'q' && castle[color] === 'none') {
      castle[color] = 'queen-side'
    } else if (normal === 'k' && castle[color] === 'none') {
      castle[color] = 'king-side'
    } else {
      castle[color] = 'both'
    }
  }

  return castle
}

/**
 * Takes the FEN notation for the board and creates a `Position` arrays from it.
 *
 * @param fen The FEN board notation
 * @returns A 64 length array of positions as read from the FEN
 * @throws If the FEN string is misformatted
 */
export function parseFENBoard(fen: string): Position[] {
  const positions: Position[] = []
  let index = 0
  let didHaveSeparator = true

  const color = (col: number, row: number): Color => (col % 2 === row % 2 ? 'black' : 'white')
  const fill = (count: number, piece?: Piece) => {
    for (let idx = index; idx < index + count; ++idx) {
      const col = (idx % 8) + 1
      const row = 7 - Math.floor(idx / 8) + 1

      if (piece) {
        positions[idx] = {
          color: color(col, row),
          piece: piece,
          row,
          column: col,
        }
      } else {
        positions[idx] = {
          color: color(col, row),
          row,
          column: col,
        }
      }
    }
  }

  for (const char of fen) {
    if (char === '/') {
      if (index % 8 !== 0) {
        throw Error(`A row separator is required each 8 cells`)
      } else {
        didHaveSeparator = true
        continue
      }
    }

    if (index % 8 === 0 && char !== '/' && !didHaveSeparator) {
      throw Error(`A row separator is required each 8 cells`)
    }

    const num = parseInt(char)

    didHaveSeparator = false

    if (Number.isNaN(num)) {
      const piece = parseFENPiece(char)
      fill(1, piece)
      index += 1
    } else {
      fill(num)
      index += num
    }
  }

  return positions
}
