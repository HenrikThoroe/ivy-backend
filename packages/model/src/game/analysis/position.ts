import { Board } from '../model/Board'
import { Color } from '../model/Game'

interface Result {
  index: number
  distance: number
}

type Axis = 'horizontal' | 'vertical'

type Diagonal = 'ascending' | 'descending'

type Direction = 'forward' | 'backward'

export function scanAxis(board: Board, index: number, axis: Axis, direction: Direction) {
  const factor = direction === 'backward' ? -1 : 1

  if (axis === 'horizontal') {
    return scan(board, index, factor, 'rank')
  } else {
    return scan(board, index, 8 * factor, 'file')
  }
}

export function scanDiagonal(
  board: Board,
  index: number,
  diagonal: Diagonal,
  direction: Direction
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

export function* scan(
  board: Board,
  index: number,
  step: number,
  verify: 'diagonal' | 'rank' | 'file'
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

export function next(
  board: Board,
  color: Color,
  index: number,
  step: number,
  verify: 'diagonal' | 'rank' | 'file'
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
