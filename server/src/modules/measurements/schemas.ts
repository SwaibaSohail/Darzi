import { z } from 'zod'

export const MEASUREMENT_KEYS = [
  'neck',
  'chest',
  'waist',
  'hip',
  'shoulder',
  'sleeve',
  'shirtLength',
  'trouserLength',
  'inseam',
  'thigh',
] as const

export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number]

// Plausible human ranges; prevents junk data and fat-finger errors.
const RANGES = {
  cm: { min: 10, max: 250 },
  in: { min: 4, max: 100 },
}

function valuesSchema(unit: 'cm' | 'in') {
  const { min, max } = RANGES[unit]
  return z
    .partialRecord(z.enum(MEASUREMENT_KEYS), z.number().min(min).max(max))
    .refine((v) => Object.keys(v).length > 0, 'At least one measurement is required')
}

export const measurementProfileSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    unit: z.enum(['cm', 'in']),
    values: z.partialRecord(z.enum(MEASUREMENT_KEYS), z.number()),
    notes: z.string().trim().max(500).default(''),
  })
  .strict()
  .superRefine((data, ctx) => {
    const check = valuesSchema(data.unit).safeParse(data.values)
    if (!check.success) {
      for (const issue of check.error.issues) {
        ctx.addIssue({ code: 'custom', message: issue.message, path: ['values', ...issue.path] })
      }
    }
  })

export const MAX_PROFILES_PER_USER = 10
