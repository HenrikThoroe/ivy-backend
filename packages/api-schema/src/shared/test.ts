import { TestSuite } from '@ivy-chess/model'
import { z } from 'zod'
import { engineTestConfigSchema } from './engine'

/**
 * Schema for {@link TestSuite}.
 */
export const suiteSchema = z.object({
  name: z.string().nonempty(),
  id: z.string().uuid(),
  iterations: z.number().int().positive(),
  engines: z.tuple([engineTestConfigSchema, engineTestConfigSchema]),
}) satisfies z.ZodType<TestSuite>
