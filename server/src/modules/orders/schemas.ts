import { z } from 'zod'
import { MEASUREMENT_KEYS } from '../measurements/schemas.js'

// Client sends references and selections ONLY — any price-shaped field is
// rejected by .strict().
const productLineSchema = z
  .object({
    kind: z.literal('product'),
    productId: z.string().trim().min(1).max(60),
    qty: z.number().int().min(1).max(10),
    size: z.string().trim().min(1).max(8).optional(),
  })
  .strict()

const customLineSchema = z
  .object({
    kind: z.literal('custom'),
    serviceId: z.string().trim().min(1).max(60),
    optionSelections: z
      .array(
        z
          .object({
            key: z.string().trim().min(1).max(30),
            value: z.string().trim().min(1).max(30),
          })
          .strict(),
      )
      .max(10)
      .default([]),
    fabric: z.discriminatedUnion('source', [
      z.object({ source: z.literal('shop'), productId: z.string().trim().min(1).max(60) }).strict(),
      z.object({ source: z.literal('own') }).strict(),
    ]),
    // exactly one of these two — enforced in the service layer
    measurementProfileId: z.string().trim().min(1).max(60).optional(),
    measurements: z
      .object({
        unit: z.enum(['cm', 'in']),
        values: z.partialRecord(z.enum(MEASUREMENT_KEYS), z.number()),
      })
      .strict()
      .optional(),
    styleNotes: z.string().trim().max(1000).default(''),
    referenceImagePath: z.string().trim().max(300).optional(),
  })
  .strict()

export type CustomLineInput = z.infer<typeof customLineSchema>
export type ProductLineInput = z.infer<typeof productLineSchema>

export const createOrderSchema = z
  .object({
    items: z.array(z.discriminatedUnion('kind', [productLineSchema, customLineSchema])).min(1).max(20),
    address: z
      .object({
        line1: z.string().trim().min(1).max(120),
        city: z.string().trim().min(1).max(60),
        postal: z.string().trim().min(1).max(15),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
      })
      .strict(),
    paymentMethod: z.literal('cod'),
  })
  .strict()

export type CreateOrderInput = z.infer<typeof createOrderSchema>
