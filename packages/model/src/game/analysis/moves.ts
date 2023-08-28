import { Board, Piece } from '../model/Board'
import { Color } from '../model/Game'
import { scanAxis, scanDiagonal } from './position'
import { hasThreat } from './threats'

function add(board: Board, result: number[], color: Color, idx: number) {
  const piece = board.positions[idx].piece

  if (piece?.color === color) {
    return false
  }

  result.push(idx)

  if (piece && piece.color !== color) {
    return false
  }

  return true
}

function knightMoves(board: Board, index: number) {
  const steps = [10, 17, 6, 15, -10, -17, -6, -15]
  const possibilities: number[] = []
  const src = board.positions[index]
  const result: number[] = []

  for (const step of steps) {
    const target = index + step

    if (target > -1 && target < 64) {
      possibilities.push(target)
    }
  }

  for (const possibility of possibilities) {
    const target = board.positions[possibility]
    const colDiff = Math.abs(target.column - src.column)
    const rowDiff = Math.abs(target.row - src.row)

    if (target.piece && target.piece?.color === src.piece?.color) {
      continue
    }

    if (colDiff === 1 && rowDiff === 2) {
      result.push(possibility)
    }

    if (colDiff === 2 && rowDiff === 1) {
      result.push(possibility)
    }
  }

  return result
}

function pawnMoves(board: Board, index: number) {
  const piece = board.positions[index].piece!
  let steps = [8, 9, 7]
  const src = board.positions[index]
  const startRanks = [2, 7]

  if (startRanks.includes(src.row)) {
    steps.push(16)
  }

  if (piece.color === 'white') {
    steps = steps.map((s) => -1 * s)
  }

  return steps
    .map((step) => index + step)
    .filter((target) => target >= 0 && target < 64)
    .filter((target) => {
      const colDiff = Math.abs(board.positions[target].column - src.column)
      const rowDiff = Math.abs(board.positions[target].row - src.row)
      const targetPiece = board.positions[target].piece

      if (colDiff > 1) {
        return false
      }

      //? Cannot jump over piece in front
      if (rowDiff === 2) {
        const diff = target - index
        const mid = index + diff / 2

        if (board.positions[mid].piece) {
          return false
        }
      }

      //? Cannot take when moving on the file
      if (targetPiece && colDiff === 0) {
        return false
      }

      //? Can only move on the diagonal when taking enemy pieces or En Pássant
      const isTargetSameColor = targetPiece?.color === src.piece?.color
      const isEnPassantTarget = board.enPassant === target

      if (colDiff > 0 && (!targetPiece || isTargetSameColor) && !isEnPassantTarget) {
        return false
      }

      return true
    })
}

function rookMoves(board: Board, index: number) {
  const result: number[] = []
  const src = board.positions[index]

  const directions = [
    ['horizontal', 'forward'],
    ['horizontal', 'backward'],
    ['vertical', 'forward'],
    ['vertical', 'backward'],
  ] as const

  for (const [axis, dir] of directions) {
    for (const res of scanAxis(board, index, axis, dir)) {
      if (!add(board, result, src.piece!.color, res.index)) {
        break
      }
    }
  }

  return result
}

function bishopMoves(board: Board, index: number) {
  const result: number[] = []
  const src = board.positions[index]

  const directions = [
    ['ascending', 'forward'],
    ['ascending', 'backward'],
    ['descending', 'forward'],
    ['descending', 'backward'],
  ] as const

  for (const [dia, dir] of directions) {
    for (const res of scanDiagonal(board, index, dia, dir)) {
      if (!add(board, result, src.piece!.color, res.index)) {
        break
      }
    }
  }

  return result
}

function kingMoves(board: Board, index: number) {
  const src = board.positions[index]
  const result: number[] = []
  const castling = board.castleRights[src.piece!.color]
  const castleOffset = 2

  const hasCheckOnPath = (kingSide: boolean) => {
    const step = kingSide ? 1 : -1

    for (let i = 0; i <= castleOffset; i++) {
      if (hasThreat(board, src.piece!.color, index + i * step)) {
        return true
      }
    }

    return false
  }

  const hasPieceOnPath = (kingSide: boolean) => {
    const step = kingSide ? 1 : -1
    const pathLen = kingSide ? 2 : 3

    for (let i = 1; i <= pathLen; i++) {
      if (board.positions[index + step * i].piece) {
        return true
      }
    }

    return false
  }

  for (let x = -1; x <= 1; ++x) {
    for (let y = -1; y <= 1; ++y) {
      //? Ignore null move
      if (y === 0 && x === 0) {
        continue
      }

      const target = index + x + 8 * y

      if (target < 0 || target > 63) {
        continue
      }

      const pos = board.positions[target]
      const rowDiff = Math.abs(src.row - pos.row)
      const colDiff = Math.abs(src.column - pos.column)

      if (rowDiff > 1 || colDiff > 1) {
        continue
      }

      //? Do not allow to move on field occupied by own pieces
      if (board.positions[target].piece?.color === src.piece?.color) {
        continue
      }

      //? Do not allow to create a check
      if (hasThreat(board, src.piece!.color, target)) {
        continue
      }

      result.push(target)
    }
  }

  if (castling === 'king-side' || castling === 'both') {
    if (!hasCheckOnPath(true) && !hasPieceOnPath(true)) {
      result.push(index + castleOffset)
    }
  }

  if (castling === 'queen-side' || castling === 'both') {
    if (!hasCheckOnPath(false) && !hasPieceOnPath(false)) {
      result.push(index - castleOffset)
    }
  }

  return result
}

/**
 * Calculates all moves for the piece on the given index.
 * Replaces the current piece on index with the given one and reverts it afterwards.
 *
 * @param board The board to calculate the moves on.
 * @param index The index of the piece to calculate the moves for.
 * @param replace The piece to replace the current piece with.
 * @returns An array of indices that the piece on the given index can move to.
 * @throws If the index does not contain a piece.
 */
export function movesWithReplacement(board: Board, index: number, replace: Piece) {
  const current = board.positions[index].piece ? { ...board.positions[index].piece! } : undefined
  let available: number[]

  try {
    board.positions[index].piece = replace
    available = moves(board, index)
  } finally {
    board.positions[index].piece = current
  }

  return available
}

/**
 * Calculates all moves for the piece on the given index.
 * Also includes moves that would put the king in check.
 *
 * @param board The board to calculate the moves on.
 * @param index The index of the piece to calculate the moves for.
 * @returns An array of indices that the piece on the given index can move to.
 * @throws If the index does not contain a piece.
 */
export function moves(board: Board, index: number) {
  if (!board.positions[index].piece) {
    throw Error(`Expected to find a piece at index ${index}`)
  }

  const piece = board.positions[index].piece!

  if (piece.type === 'knight') {
    return knightMoves(board, index)
  }

  if (piece.type === 'pawn') {
    return pawnMoves(board, index)
  }

  if (piece.type === 'rook') {
    return rookMoves(board, index)
  }

  if (piece.type === 'bishop') {
    return bishopMoves(board, index)
  }

  if (piece.type === 'queen') {
    const moves = new Set<number>()

    bishopMoves(board, index).forEach((move) => moves.add(move))
    rookMoves(board, index).forEach((move) => moves.add(move))

    return Array.from(moves.values())
  }

  if (piece.type === 'king') {
    return kingMoves(board, index)
  }

  throw Error(`'${piece.type}' is not supported`)
}

/**
 * Checks if the move from source to target index is valid on the given board.
 *
 * @param board The board to check the move on.
 * @param source The starting index
 * @param target The target index
 * @returns True if the move is valid, false otherwise.
 */
export function isValidMove(board: Board, source: number, target: number): boolean {
  const piece = board.positions[source].piece

  if (!piece) {
    return false
  }

  if (piece.color !== board.next) {
    return false
  }

  let isValid = moves(board, source).includes(target)

  if (isValid) {
    const targetPiece = board.positions[target].piece
    const prev = [
      { ...board.positions[source].piece! },
      targetPiece ? { ...targetPiece! } : undefined,
    ]

    board.positions[source].piece = undefined
    board.positions[target].piece = prev[0]

    const king = board.positions.findIndex(
      (pos) => pos.piece?.type === 'king' && pos.piece?.color === board.next,
    )

    if (hasThreat(board, board.next, king)) {
      isValid = false
    }

    board.positions[source].piece = prev[0]
    board.positions[target].piece = prev[1]
  }

  return isValid
}
