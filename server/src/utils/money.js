import { Prisma } from "@prisma/client";
import { z } from "zod";

export const moneyInputSchema = z
  .union([z.number(), z.string()])
  .transform((value, context) => {
    const normalizedValue =
      typeof value === "number" ? value.toFixed(2) : value.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected a valid monetary amount with up to 2 decimal places."
      });

      return z.NEVER;
    }

    return normalizedValue;
  });

export function toDecimal(value) {
  return new Prisma.Decimal(value);
}

export function moneyToString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return toDecimal(value).toFixed(2);
  }

  if (value instanceof Prisma.Decimal) {
    return value.toFixed(2);
  }

  return new Prisma.Decimal(value).toFixed(2);
}
