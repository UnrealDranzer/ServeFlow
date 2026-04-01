import { z } from "zod";
import { booleanFromUnknownSchema, sortOrderSchema, trimmedString, uuidParamSchema } from "../../utils/validation.js";

export const categoryParamsSchema = uuidParamSchema;

export const listCategoriesQuerySchema = z.object({
  activeOnly: booleanFromUnknownSchema.optional().default(false)
});

export const createCategoryBodySchema = z.object({
  name: trimmedString(120),
  sortOrder: sortOrderSchema.optional().default(0),
  isActive: booleanFromUnknownSchema.optional().default(true)
});

export const updateCategoryBodySchema = z.object({
  name: trimmedString(120),
  sortOrder: sortOrderSchema.optional().default(0),
  isActive: booleanFromUnknownSchema
});
