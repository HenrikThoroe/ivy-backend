import {
  Performance,
  VerificationGroup,
  VerificationGroupState,
  VerificationResult,
} from '@ivy-chess/model'
import { z } from 'zod'
import { engineTestConfigSchema } from './engine'
import { nameSchema, withIdSchema } from './generic'

/**
 * Schema for {@link Performance}.
 */
export const performanceSchema = z.object({
  wins: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  defeats: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  winRatio: z.number(),
  win2DefeatRatio: z.number(),
}) satisfies z.ZodType<Performance>

/**
 * Schema for {@link VerificationGroup} without id.
 */
export const verificationGroupWithoutIdSchema = z.object({
  name: nameSchema,
  base: engineTestConfigSchema,
  threshold: z.number().int().positive(),
  nodes: z.array(engineTestConfigSchema).min(1),
}) satisfies z.ZodType<Omit<VerificationGroup, 'id'>>

/**
 * Schema for {@link VerificationGroup}.
 */
export const verificationGroupSchema = verificationGroupWithoutIdSchema.merge(
  withIdSchema,
) satisfies z.ZodType<VerificationGroup>

/**
 * Schema for {@link VerificationGroupState}.
 */
export const verificationGroupStateSchema = z.object({
  hasResult: z.boolean(),
  nodes: z.array(
    z.object({
      progress: z.number().nonnegative(),
      node: engineTestConfigSchema,
    }),
  ),
}) satisfies z.ZodType<VerificationGroupState>

/**
 * Schema for {@link VerificationResult}.
 */
export const verificationResultSchema = z.object({
  group: z.string().uuid(),
  results: z.array(
    z.object({
      node: engineTestConfigSchema,
      performance: z.object({
        white: performanceSchema,
        black: performanceSchema,
        accumulated: performanceSchema,
      }),
    }),
  ),
}) satisfies z.ZodType<VerificationResult>
