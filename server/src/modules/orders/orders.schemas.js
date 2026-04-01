import { z } from "zod";
import { orderStatusValues, orderTypeValues } from "../../utils/enums.js";
import {
  isoDateTimeQuerySchema,
  optionalNullableTrimmedString,
  paginationQuerySchema,
  positiveIntSchema,
  uuidParamSchema
} from "../../utils/validation.js";

function commaSeparatedEnumArraySchema(values, label) {
  return z
    .string()
    .trim()
    .optional()
    .transform((value, context) => {
      if (!value) {
        return undefined;
      }

      const parsedValues = value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      const invalidValues = parsedValues.filter((item) => !values.includes(item));

      if (invalidValues.length > 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid ${label}: ${invalidValues.join(", ")}`
        });

        return z.NEVER;
      }

      return parsedValues;
    });
}

export const orderParamsSchema = uuidParamSchema;

export const orderLineItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: positiveIntSchema,
  itemNote: optionalNullableTrimmedString(250)
});

export const manualOrderBodySchema = z.object({
  sourceId: z.string().uuid(),
  customerNote: optionalNullableTrimmedString(500),
  items: z.array(orderLineItemSchema).min(1).max(25)
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(orderStatusValues)
});

export const listOrdersQuerySchema = paginationQuerySchema
  .extend({
    status: commaSeparatedEnumArraySchema(orderStatusValues, "status"),
    orderType: z.enum(orderTypeValues).optional(),
    sourceId: z.string().uuid().optional(),
    dateFrom: isoDateTimeQuerySchema,
    dateTo: isoDateTimeQuerySchema
  })
  .refine(
    (value) => {
      if (!value.dateFrom || !value.dateTo) {
        return true;
      }

      return new Date(value.dateFrom) <= new Date(value.dateTo);
    },
    {
      message: "dateFrom must be earlier than or equal to dateTo.",
      path: ["dateFrom"]
    }
  );
