import {
  MoveInfo,
  Replay,
  ReplayLog,
  ReplayStats,
  TestDriver,
  TestDriverHardware,
  UCILog,
} from '@ivy-chess/model'
import { z } from 'zod'
import { engineTestConfigSchema } from './engine'
import { moveSchema } from './game'
import { nameSchema } from './generic'

/**
 * Schema for log entries.
 */
export const logEntrySchema = z.object({
  type: z.enum(['recv', 'send']),
  value: z.string(),
})

/**
 * Schema for {@link UCILog}.
 */
export const uciLogSchema = z.object({
  messages: z.array(logEntrySchema),
}) satisfies z.ZodType<UCILog>

/**
 * Schema for {@link ReplayLog}.
 */
export const replayLogSchema = z.object({
  replay: z.string().uuid(),
  white: uciLogSchema,
  black: uciLogSchema,
}) satisfies z.ZodType<ReplayLog>

/**
 * Schema for UCI move details.
 */
export const moveDetailsSchema = z.object({
  depth: z.number().int().positive(),
  selDepth: z.number().int().positive(),
  time: z.number().int().positive(),
  nodes: z.number().int().positive(),
  pv: z.array(z.string()),
  multiPv: z.number().int().positive(),
  score: z.object({
    type: z.enum(['cp', 'mate']),
    value: z.number().int(),
    lowerbound: z.boolean(),
    upperbound: z.boolean(),
  }),
  currentMove: z.string(),
  currentMoveNumber: z.number().int().positive(),
  hashFull: z.number().int().positive(),
  nps: z.number().int().positive(),
  tbHits: z.number().int().positive(),
  sbhits: z.number().int().positive(),
  cpuLoad: z.number().int().positive(),
  string: z.string(),
  refutation: z.array(z.string()),
  currline: z.array(z.string()),
})

/**
 * Schema for {@link MoveInfo}.
 */
export const moveInfoSchema = z.object({
  move: moveSchema,
  fen: z.string(),
  details: moveDetailsSchema.partial(),
}) satisfies z.ZodType<MoveInfo>

/**
 * Schema for {@link TestDriverHardware}.
 */
export const testDriverHardwareSchema = z.object({
  cpu: z
    .array(
      z.object({
        model: z.string().optional(),
        vendor: z.string().optional(),
        cores: z.number().int().positive().optional(),
        threads: z.number().int().positive().optional(),
        capabilities: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  memory: z.number().int().positive().optional(),
  gpu: z
    .array(
      z.object({
        model: z.string().optional(),
        vendor: z.string().optional(),
        memory: z.number().int().positive().optional(),
      }),
    )
    .optional(),
  model: z.string().optional(),
  os: z.string().optional(),
  arch: z.string().optional(),
}) satisfies z.ZodType<TestDriverHardware>

/**
 * Schema for {@link TestDriver}.
 */
export const testDriverSchema = z.object({
  id: z.string().nonempty(),
  name: nameSchema,
  hardware: testDriverHardwareSchema,
}) satisfies z.ZodType<TestDriver>

/**
 * Schema for {@link Replay}.
 */
export const replaySchema = z.object({
  id: z.string().uuid(),
  date: z.coerce.date(),
  driver: testDriverSchema,
  engines: z.object({
    white: engineTestConfigSchema,
    black: engineTestConfigSchema,
  }),
  result: z.object({
    winner: z.enum(['white', 'black', 'draw']),
    reason: z.enum([
      'rule-violation',
      'checkmate',
      'stalemate',
      '50-move-draw',
      '3-fold-repetition',
      'insufficient-material',
    ]),
  }),
  history: z.array(moveInfoSchema),
}) satisfies z.ZodType<Replay>

/**
 * Schema for {@link ReplayStats}.
 */
export const replayStatsSchema = z.object({
  replay: z.string().uuid(),
  version: z.number().int(),
  moves: z.number().int(),
  performance: z.object({
    normalized: z
      .object({
        white: z.array(z.number()),
        black: z.array(z.number()),
      })
      .partial(),
    centipawn: z
      .object({
        white: z.array(z.number()),
        black: z.array(z.number()),
      })
      .partial(),
  }),
}) satisfies z.ZodType<ReplayStats>
