import { Board, Piece } from '../model/Board'
import { Color } from '../model/Game'
import { movesWithReplacement } from './moves'
import { next } from './position'

export function hasThreat(board: Board, color: Color, index: number) {
  const diagonalSteps = [-7, 7, 9, -9]
  const straightSteps = [1, -1, 8, -8]

  //? Check for threats on the diagonal
  for (const step of diagonalSteps) {
    const res = next(board, color, index, step, 'diagonal')

    if (res.index > -1) {
      const piece = board.positions[res.index].piece

      if ((piece?.type === 'pawn' || piece?.type === 'king') && res.distance === 1) {
        //? Black pawns can only take downwards
        if (piece.type === 'pawn' && piece.color === 'black' && step > 0) {
          continue
        }

        //? White pawns can only take upwards
        if (piece.type === 'pawn' && piece.color === 'white' && step < 0) {
          continue
        }

        return true
      }

      if (piece?.type === 'bishop' || piece?.type === 'queen') {
        return true
      }
    }
  }

  //? Check for threats on the axis
  for (const step of straightSteps) {
    const isHorizontal = Math.abs(step) === 1
    const res = next(board, color, index, step, isHorizontal ? 'rank' : 'file')

    if (res.index > -1) {
      const piece = board.positions[res.index].piece

      if (piece?.type === 'king' && res.distance === 1) {
        return true
      }

      if (piece?.type === 'queen' || piece?.type === 'rook') {
        return true
      }
    }
  }

  //? Check for threats by the knight
  const horse: Piece = { color, type: 'knight' }
  let knightThreats = movesWithReplacement(board, index, horse)

  for (const threat of knightThreats) {
    const piece = board.positions[threat].piece

    if (piece && piece.color !== color && piece.type === 'knight') {
      return true
    }
  }

  return false
}
