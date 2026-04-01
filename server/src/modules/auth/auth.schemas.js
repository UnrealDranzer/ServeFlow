import { z } from "zod";
import { businessTypeValues } from "../../utils/enums.js";
import { normalizeSlug } from "../../utils/slug.js";

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine(
    (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value),
    "Password must include uppercase, lowercase, and a number."
  );

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

export const registerBodySchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  businessSlug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => normalizeSlug(value))
    .refine((value) => value.length > 0, {
      message: "Business slug must contain letters or numbers."
    }),
  ownerName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: passwordSchema,
  businessType: z.enum(businessTypeValues),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((value) => (value ? value : undefined))
});
