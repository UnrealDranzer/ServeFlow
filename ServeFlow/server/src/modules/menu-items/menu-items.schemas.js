import { z } from "zod";
import { moneyInputSchema } from "../../utils/money.js";
import {
  booleanFromUnknownSchema,
  optionalNullableTrimmedString,
  sortOrderSchema,
  trimmedString,
  uuidParamSchema
} from "../../utils/validation.js";

export const menuItemParamsSchema = uuidParamSchema;

export const listMenuItemsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  availableOnly: booleanFromUnknownSchema.optional().default(false),
  search: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined))
});

export const createMenuItemBodySchema = z.object({
  categoryId: z.string().uuid(),
  name: trimmedString(140),
  description: optionalNullableTrimmedString(1000),
  price: moneyInputSchema,
  imageUrl: optionalNullableTrimmedString(2048),
  isAvailable: booleanFromUnknownSchema.optional().default(true),
  isVeg: booleanFromUnknownSchema.optional().default(false),
  sortOrder: sortOrderSchema.optional().default(0)
});

export const updateMenuItemBodySchema = createMenuItemBodySchema;

export const patchAvailabilityBodySchema = z.object({
  isAvailable: booleanFromUnknownSchema
});
