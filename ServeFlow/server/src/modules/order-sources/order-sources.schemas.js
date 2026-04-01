import { z } from "zod";
import { sourceTypeValues } from "../../utils/enums.js";
import {
  booleanFromUnknownSchema,
  optionalTrimmedString,
  trimmedString,
  uuidParamSchema
} from "../../utils/validation.js";

export const orderSourceParamsSchema = uuidParamSchema;

export const createOrderSourceBodySchema = z.object({
  name: trimmedString(120),
  slug: optionalTrimmedString(80),
  sourceType: z.enum(sourceTypeValues),
  isActive: booleanFromUnknownSchema.optional().default(true)
});

export const updateOrderSourceBodySchema = createOrderSourceBodySchema;
