import { z } from 'zod'
import { logEntrySchema, moveDetailsSchema, testDriverHardwareSchema } from '../../shared/replay'
import { suiteSchema } from '../../shared/test'
import { io } from '../../types/io'

/**
 * Schema for moves as received from the client.
 */
export const moveSchema = z
  .object({
    move: z.string().nonempty(),
  })
  .merge(moveDetailsSchema.partial())

/**
 * Schema for a single game played by a client.
 * The tuple contains two arrays of moves, one for each player/engine.
 */
export const gameDataSchema = z.tuple([z.array(moveSchema), z.array(moveSchema)])

/**
 * Schema for log entries as received from the client.
 * The tuple contains two arrays of log entries, one for each player/engine.
 */
export const logDataSchema = z.tuple([z.array(logEntrySchema), z.array(logEntrySchema)])

/**
 * Schema of the register message sent by a client.
 */
export const registerSchema = z.object({
  name: z.string().nonempty(),
  deviceId: z
    .string()
    .optional()
    .transform((v) => (v?.length === 0 ? undefined : v)),
  hardware: testDriverHardwareSchema,
})

/**
 * Schema of the report message sent by a client.
 * Includes a set of games and logs as well
 * as the session id to which the report belongs.
 */
export const reportSchema = z.object({
  session: z.string().uuid(),
  moves: z.array(gameDataSchema),
  logs: z.array(logDataSchema),
})

/**
 * Schema of the driver web socket interface.
 * The API between the engine driver and the backend.
 */
export const driverInterface = io(
  {
    register: registerSchema,
    report: reportSchema,
  },
  {
    registered: z.object({
      key: z.literal('registered'),
      id: z.string().nonempty(),
    }),
    request: z.object({
      key: z.literal('start'),
      session: z.string().uuid(),
      suite: suiteSchema,
      recommendedBatchSize: z.number().int().positive(),
    }),
  },
)
