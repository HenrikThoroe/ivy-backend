import { Board } from '../model/Board'
import { Color } from '../model/Game'

/**
 * The result of a scan.
 * Contains the index and the distance from the starting index.
 */
interface Result {
  index: number
  distance: number
}

/**
 * The axis on which to scan.
 */
type Axis = 'horizontal' | 'vertical'

/**
 * The diagonal on which to scan.
 */
type Diagonal = 'ascending' | 'descending'

/**
 * The direction in which to scan.
 * Forward is towards the end of the board.
 * Backward is towards the start of the board.
 * The direction is relative to the color.
 */
type Direction = 'forward' | 'backward'

/**
 * Scans an axis on the board in the given direction.
 *
 * @param board The board to scan.
 * @param index The starting index.
 * @param axis Either horizontal or vertical.
 * @param direction Either forward or backward relative to the allowed pawn direction.
 * @returns A `Generator` of {@link Result} objects. Result contains the index and the distance from the starting index.
 */
export function scanAxis(board: Board, index: number, axis: Axis, direction: Direction) {
  const factor = direction === 'backward' ? -1 : 1

  if (axis === 'horizontal') {
    return scan(board, index, factor, 'rank')
  } else {
    return scan(board, index, 8 * factor, 'file')
  }
}

/**
 * Scans a diagonal on the board in the given direction.
 *
 * @param board The board to scan.
 * @param index The starting index.
 * @param diagonal Either ascending or descending. Ascending is a line that would go from a1 to h8. Descending is a line that would go from a8 to h1.
 * @param direction Either forward or backward relative to the allowed pawn direction.
 * @returns A `Generator` of {@link Result} objects. Result contains the index and the distance from the starting index.
 */
export function scanDiagonal(
  board: Board,
  index: number,
  diagonal: Diagonal,
  direction: Direction,
) {
  const factor =
    diagonal === 'ascending'
      ? direction === 'forward'
        ? -1
        : 1
      : direction === 'backward'
        ? -1
        : 1

  if (diagonal === 'descending') {
    return scan(board, index, 9 * factor, 'diagonal')
  } else {
    return scan(board, index, 7 * factor, 'diagonal')
  }
}

/**
 * Scans the board using the given step distance applied to the indecies.
 *
 * @param board The board to scan.
 * @param index The starting index.
 * @param step The step distance. It is applied to each index to get the next index.
 * @param verify Verify is used to determine if the next index is still on the same rank, file or diagonal.
 * @returns A `Generator` of {@link Result} objects. Result contains the index and the distance from the starting index.
 */
export function* scan(
  board: Board,
  index: number,
  step: number,
  verify: 'diagonal' | 'rank' | 'file',
): Generator<Result> {
  let current = index
  let distance = 0
  let last = board.positions[index]

  do {
    current += step
    distance += 1

    if (current < 0 || current > 63) {
      return
    }

    if (verify === 'file' && board.positions[current].column !== last.column) {
      return
    }

    if (verify === 'rank' && board.positions[current].row !== last.row) {
      return
    }

    if (verify === 'diagonal') {
      const xDiff = Math.abs(last.column - board.positions[current].column)
      const yDiff = Math.abs(last.row - board.positions[current].row)

      if (xDiff !== 1 || yDiff !== 1) {
        return
      }
    }

    last = board.positions[current]

    yield {
      index: current,
      distance,
    }
  } while (true)
}

/**
 * Returns the position of the next piece on the board in the given direction.
 *
 * @param board The board to scan.
 * @param color The opposite color of which piece color to find.
 * @param index The starting index.
 * @param step The step distance. It is applied to each index to get the next index.
 * @param verify Verify is used to determine if the next index is still on the same rank, file or diagonal.
 * @returns The {@link Result} object. Result contains the index and the distance from the starting index.
 *          If no piece is found, the index is -1 and the distance is -1.
 */
export function next(
  board: Board,
  color: Color,
  index: number,
  step: number,
  verify: 'diagonal' | 'rank' | 'file',
): Result {
  const empty = {
    index: -1,
    distance: -1,
  }

  for (const res of scan(board, index, step, verify)) {
    const piece = board.positions[res.index].piece

    if (piece && piece.color === color) {
      return empty
    }

    if (piece && piece.color !== color) {
      return res
    }
  }

  return empty
}
