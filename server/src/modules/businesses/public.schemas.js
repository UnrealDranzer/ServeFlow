import { z } from "zod";
import { normalizeSlug } from "../../utils/slug.js";
import { optionalNullableTrimmedString } from "../../utils/validation.js";
import { orderLineItemSchema } from "../orders/orders.schemas.js";

export const publicRouteParamsSchema = z.object({
  businessSlug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => normalizeSlug(value)),
  sourceSlug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => normalizeSlug(value))
});

export const createPublicOrderBodySchema = z.object({
  customerNote: optionalNullableTrimmedString(500),
  items: z.array(orderLineItemSchema).min(1).max(25)
});
