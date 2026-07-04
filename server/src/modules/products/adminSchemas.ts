import { z } from 'zod'

const imageSchema = z
  .object({
    url: z.string().url().max(500),
    path: z.string().max(200).nullable(),
  })
  .strict()

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(2000),
    category: z.enum(['ready-made', 'fabric']),
    subcategory: z.string().trim().min(1).max(40),
    price: z.number().int().min(1).max(100_000_000),
    sizes: z.array(z.string().trim().min(1).max(8)).max(10).default([]),
    images: z.array(imageSchema).max(6).default([]),
    stock: z.number().int().min(0).max(10_000),
    active: z.boolean().default(true),
  })
  .strict()

export const updateProductSchema = createProductSchema.partial().strict()

const choiceSchema = z
  .object({
    value: z.string().trim().min(1).max(30),
    label: z.string().trim().min(1).max(60),
    priceDelta: z.number().int().min(0).max(10_000_000),
  })
  .strict()

const optionSchema = z
  .object({
    key: z.string().trim().min(1).max(30),
    label: z.string().trim().min(1).max(60),
    choices: z.array(choiceSchema).min(1).max(10),
  })
  .strict()

export const createServiceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(2000),
    basePrice: z.number().int().min(1).max(100_000_000),
    options: z.array(optionSchema).max(10).default([]),
    measurementFields: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
    image: imageSchema.nullable().default(null),
    active: z.boolean().default(true),
  })
  .strict()

export const updateServiceSchema = createServiceSchema.partial().strict()
