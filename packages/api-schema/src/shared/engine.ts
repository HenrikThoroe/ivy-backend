import { EngineTestConfig, EngineVersion } from '@ivy-chess/model'
import * as z from 'zod'

/**
 * Schema for engine names.
 * Names must contain only letters, numbers and dashes.
 * They must be between 1 and 100 characters long.
 */
export const engineNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9\-]+$/)
  .min(1)
  .max(100)

/**
 * Schema for {@link EngineVersion}
 */
export const versionSchema = z.object({
  major: z.number().int().nonnegative(),
  minor: z.number().int().nonnegative(),
  patch: z.number().int().nonnegative(),
}) satisfies z.ZodType<EngineVersion>

/**
 * Schema for {@link EngineTestConfig}
 */
export const engineTestConfigSchema = z.object({
  name: engineNameSchema,
  version: versionSchema,
  timeControl: z.object({
    type: z.enum(['depth', 'movetime']),
    value: z.number().int().positive(),
  }),
  options: z.object({
    hash: z.number().int().positive(),
    threads: z.number().int().positive(),
  }),
}) satisfies z.ZodType<EngineTestConfig>
