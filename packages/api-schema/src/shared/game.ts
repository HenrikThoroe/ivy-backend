import {
  Board,
  CastleRights,
  Color,
  Game,
  GameState,
  Move,
  Piece,
  Position,
  TerminationReason,
} from '@ivy-chess/model'
import { z } from 'zod'

/**
 * Schema for {@link Color}.
 */
export const colorSchema = z.literal('white').or(z.literal('black')) as z.ZodSchema<Color>

/**
 * Schema for {@link GameState}.
 */
export const gameStateSchema = z
  .literal('waiting')
  .or(z.literal('active'))
  .or(z.literal('expired')) satisfies z.ZodType<GameState>

/**
 * Schema for {@link Piece}.
 */
export const pieceSchema = z.object({
  type: z.enum(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']),
  color: colorSchema,
}) as z.ZodSchema<Piece>

/**
 * Schema for {@link Move}.
 */
export const moveSchema = z.object({
  source: z.number(),
  target: z.number(),
  promotion: pieceSchema.optional(),
}) as z.ZodSchema<Move>

/**
 * Schema for {@link Position}.
 */
export const positionSchema = z.object({
  color: colorSchema,
  piece: pieceSchema.optional(),
  row: z.number(),
  column: z.number(),
}) as z.ZodSchema<Position>

/**
 * Schema for {@link CastleRights}.
 */
export const castleRightsSchema = z.enum([
  'queen-side',
  'king-side',
  'none',
  'both',
]) satisfies z.ZodType<CastleRights>

/**
 * Schema for {@link TerminationReason}.
 */
export const terminationReasonSchema = z
  .literal('rule-violation')
  .or(z.literal('time'))
  .or(z.literal('resignation'))
  .or(z.literal('checkmate'))
  .or(z.literal('stalemate'))
  .or(z.literal('3-fold-repetition'))
  .or(z.literal('50-move-draw')) satisfies z.ZodSchema<TerminationReason>

/**
 * Schema for {@link Board}.
 */
export const boardSchema = z.object({
  positions: z.array(positionSchema).length(64),
  next: colorSchema,
  castleRights: z.object({
    white: castleRightsSchema,
    black: castleRightsSchema,
  }),
  enPassant: z.number().optional(),
  halfMoveCounter: z.number().nonnegative(),
  fullMoveCounter: z.number().nonnegative(),
}) satisfies z.ZodType<Board>

/**
 * Schema for {@link Game}.
 */
export const gameSchema = z.object({
  id: z.string().uuid(),
  players: z
    .object({
      white: z.string().uuid(),
      black: z.string().uuid(),
    })
    .partial(),
  time: z.object({
    white: z.number(),
    black: z.number(),
  }),
  timeback: z.object({
    white: z.number().nonnegative(),
    black: z.number().nonnegative(),
  }),
  history: z.array(moveSchema),
  start: z.number(),
  positionHistory: z.array(z.string().nonempty()),
  winner: colorSchema.or(z.literal('draw')).optional(),
  board: boardSchema,
  state: gameStateSchema,
  lastRequest: z.number(),
  reason: terminationReasonSchema.optional(),
  startFen: z.string().nonempty(),
}) satisfies z.ZodSchema<Game>
