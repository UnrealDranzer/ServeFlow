import { z } from "zod";

export const uuidParamSchema = z.object({
  id: z.string().uuid()
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const trimmedString = (maxLength) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength);

export const optionalTrimmedString = (maxLength) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => (value ? value : undefined));

export const optionalNullableTrimmedString = (maxLength) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .refine((value) => value === null || value === undefined || value.length <= maxLength, {
      message: `Must be at most ${maxLength} characters.`
    })
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      return value;
    });

export const sortOrderSchema = z.coerce.number().int().min(0).max(10_000).default(0);
export const positiveIntSchema = z.coerce.number().int().min(1).max(100);
export const booleanFromUnknownSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "1"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "0"].includes(normalizedValue)) {
      return false;
    }
  }

  return value;
}, z.boolean());

export const isoDateTimeQuerySchema = z
  .string()
  .datetime({ offset: true })
  .optional();
