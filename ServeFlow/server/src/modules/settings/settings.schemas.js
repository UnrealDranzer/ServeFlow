import { z } from "zod";
import {
  businessTypeValues,
  orderModeValues
} from "../../utils/enums.js";
import {
  booleanFromUnknownSchema,
  optionalNullableTrimmedString,
  trimmedString
} from "../../utils/validation.js";

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine(
    (value) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: value });
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Expected a valid IANA timezone."
    }
  );

export const updateSettingsBodySchema = z.object({
  name: trimmedString(120),
  businessType: z.enum(businessTypeValues),
  ownerName: trimmedString(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: trimmedString(32),
  logoUrl: optionalNullableTrimmedString(2048),
  currency: z.string().trim().toUpperCase().length(3),
  orderMode: z.enum(orderModeValues),
  acceptingOrders: booleanFromUnknownSchema,
  showImages: booleanFromUnknownSchema,
  showItemDescription: booleanFromUnknownSchema,
  showVegBadge: booleanFromUnknownSchema,
  timezone: timezoneSchema
});
