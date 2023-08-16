import { Move, Piece } from '@ivy-chess/model'
import { z } from 'zod'

/**
 * Schema for {@link Piece}.
 */
export const pieceSchema = z.object({
  type: z.enum(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']),
  color: z.enum(['white', 'black']),
}) as z.ZodSchema<Piece>

/**
 * Schema for {@link Move}.
 */
export const moveSchema = z.object({
  source: z.number(),
  target: z.number(),
  promotion: pieceSchema.optional(),
}) as z.ZodSchema<Move>
