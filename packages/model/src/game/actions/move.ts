import { gameResult, isChecked } from '../analysis/end'
import { isValidMove } from '../analysis/moves'
import { parseFENMove, parseFENPiece } from '../coding/fen_parsing'
import { Board, Piece, hash } from '../model/Board'
import { Game, Move } from '../model/Game'

function getEnemy(board: Board) {
  return board.next === 'black' ? 'white' : 'black'
}

function performMove(board: Board, move: Move) {
  const { source, target, promotion } = move
  const piece = board.positions[source].piece!
  const color = board.next
  const enemy = getEnemy(board)
  const hasTargetPiece = board.positions[target].piece !== undefined
  let shouldResetEnPassant = true

  board.positions[source].piece = undefined
  board.positions[target].piece = piece
  board.next = enemy

  if (hasTargetPiece || piece.type === 'pawn') {
    board.halfMoveCounter = 0
  } else {
    board.halfMoveCounter += 1
  }

  if (promotion) {
    board.positions[target].piece!.type = promotion.type
  }

  if (color === 'black') {
    board.fullMoveCounter += 1
  }

  if (piece.type === 'king') {
    const start = board.positions[source]
    const end = board.positions[target]
    const step = Math.abs(start.column - end.column)

    board.castleRights[color] = 'none'

    if (step === 2) {
      if (end.column === 7) {
        board.positions[target - 1].piece = board.positions[target + 1].piece
        board.positions[target + 1].piece = undefined
      } else {
        board.positions[target + 1].piece = board.positions[target - 2].piece
        board.positions[target - 2].piece = undefined
      }
    }
  }

  if (piece.type === 'rook') {
    const pos = board.positions[source]
    const isInitialMove = (pos.column === 1 || pos.column === 8) && (pos.row === 8 || pos.row === 1)

    if (isInitialMove) {
      const isQueenSide = pos.column === 1

      if (isQueenSide && board.castleRights[color] === 'both') {
        board.castleRights[color] = 'king-side'
      } else if (!isQueenSide && board.castleRights[color] === 'both') {
        board.castleRights[color] = 'queen-side'
      } else if (board.castleRights[color] !== 'both') {
        board.castleRights[color] = 'none'
      }
    }
  }

  if (piece.type === 'pawn') {
    const start = board.positions[source]
    const end = board.positions[target]
    const step = Math.abs(start.row - end.row)

    if (target === board.enPassant) {
      const dir = color === 'white' ? 1 : -1
      const captured = target + dir * 8

      board.positions[captured].piece = undefined
    }

    if (step === 2) {
      const dist = target - source
      const mid = source + dist / 2

      board.enPassant = mid
      shouldResetEnPassant = false
    }
  }

  if (shouldResetEnPassant) {
    board.enPassant = undefined
  }
}

function validateTime(game: Game) {
  const arrival = Date.now()
  const color = game.board.next
  let delta = game.lastRequest > 0 ? arrival - game.lastRequest : 0
  const enemy = getEnemy(game.board)

  game.time[color] -= delta

  if (game.time[color] <= 0) {
    game.state = 'expired'
    game.reason = 'time'
    game.winner = enemy
    return false
  } else {
    game.time[color] += game.timeback[color]
    return true
  }
}

function validateMove(game: Game, move: Move) {
  const enemy = getEnemy(game.board)
  const { source, target, promotion } = move
  const valid = isValidMove(game.board, source, target)
  const isInvalidPromotionTarget = move.promotion && !(target >= 56 || target <= 7)
  const isInvalidPromotionPiece = move.promotion?.type === 'king' || move.promotion?.type === 'pawn'

  if (!valid || isInvalidPromotionTarget || isInvalidPromotionPiece) {
    game.state = 'expired'
    game.reason = 'rule-violation'
    game.winner = enemy
    return false
  }

  performMove(game.board, move)

  game.history.push({ source, target, promotion })
  game.positionHistory.push(hash(game.board))

  return true
}

function parseMove(game: Game, code: string): Move {
  let move: [number, number] | 'nullmove'
  let piece: Piece | undefined

  if (code.length === 5) {
    move = parseFENMove(code.substring(0, 4))
    piece = parseFENPiece(code.substring(4))
    piece.color = game.board.next
  } else {
    move = parseFENMove(code)
  }

  if (move === 'nullmove') {
    return { source: -1, target: -1 }
  }

  return { source: move[0], target: move[1], promotion: piece }
}

function hasRepitition(game: Game) {
  const current = hash(game.board)
  const history = game.positionHistory

  return history.filter((h) => h === current).length >= 3
}

/**
 * Parses the given FEN move and applies it to the game.
 * The move is checked for validity before being applied.
 * If the move results in a game termination, the game state will be
 * adjusted accordingly.
 *
 * The game is also validated for outside factors like time
 * constraints on the current player. The remaining time will be updated
 * after the move has been successfully applied.
 *
 * The move function takes the context of the game into account,
 * to detect termination reasons like 3-fold-repetition or 50-move-draw.
 *
 * @param game The game to apply the move to.
 * @param code The FEN encoded move.
 * @throws If the move is not valid or the game is not active.
 */
export function move(game: Game, code: string) {
  if (game.state !== 'active') {
    throw Error(`Cannot perform move on inactive game.`)
  }

  if (!validateTime(game)) {
    return
  }

  const move = parseMove(game, code)

  if (move.source === -1 || move.target === -1) {
    if (isChecked(game.board)) {
      game.state = 'expired'
      game.reason = 'rule-violation'
      game.winner = getEnemy(game.board)
    } else {
      game.history.push(move)
      game.board.enPassant = undefined
      game.board.halfMoveCounter += 1
      game.board.fullMoveCounter += game.board.next === 'black' ? 1 : 0
      game.board.next = getEnemy(game.board)
    }

    return
  }

  if (!validateMove(game, move)) {
    return
  }

  let result = gameResult(game.board)

  if (hasRepitition(game)) {
    result = '3-fold-repetition'
  }

  if (result) {
    game.state = 'expired'
    game.reason = result

    if (result === 'stalemate' || result === '3-fold-repetition' || result === '50-move-draw') {
      game.winner = 'draw'
    } else {
      game.winner = getEnemy(game.board)
    }
  }
}
