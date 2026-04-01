import { z } from "zod";
import { normalizeSlug } from "../../utils/slug.js";

export const loginBodySchema = z.object({
  businessSlug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => normalizeSlug(value)),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72)
});
