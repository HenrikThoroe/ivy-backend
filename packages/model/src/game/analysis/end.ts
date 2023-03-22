import { Board } from '../model/Board'
import { isValidMove, moves } from './moves'
import { hasThreat } from './threats'

export type GameResult = 'checkmate' | 'stalemate' | '50-move-draw' | '3-fold-repetition'

function hasMoves(board: Board) {
  const color = board.next

  for (const [index, pos] of board.positions.entries()) {
    if (pos.piece?.color === color) {
      const available = moves(board, index)
      const valid = available.filter((target) => isValidMove(board, index, target))

      if (valid.length > 0) {
        return true
      }
    }
  }

  return false
}

export function isChecked(board: Board) {
  const king = board.positions.findIndex(
    (pos) => pos.piece?.type === 'king' && pos.piece.color === board.next
  )

  return hasThreat(board, board.next, king)
}

export function gameResult(board: Board): GameResult | undefined {
  const moves = hasMoves(board)
  const check = isChecked(board)

  if (!moves && check) {
    return 'checkmate'
  }

  if (!moves && !check) {
    return 'stalemate'
  }

  if (board.halfMoveCounter >= 100) {
    return '50-move-draw'
  }

  return undefined
}
