import { ApiError } from "../../utils/api-error.js";
import { toPrismaBusinessType, toPrismaOrderMode } from "../../utils/enums.js";
import { assertValidTimeZone } from "../../utils/timezone.js";
import { findSettingsBundleByBusinessId, updateBusinessAndSettings } from "./settings.repository.js";
import { toSettingsDto } from "./settings.dto.js";
import { toBusinessAdminDto } from "../businesses/businesses.dto.js";

function toSettingsBundleDto(bundle) {
  return {
    business: toBusinessAdminDto(bundle),
    settings: toSettingsDto(bundle.settings)
  };
}

export async function getSettingsForBusiness(businessId) {
  const bundle = await findSettingsBundleByBusinessId(businessId);

  if (!bundle || !bundle.settings) {
    throw ApiError.notFound("Business settings were not found.");
  }

  return toSettingsBundleDto(bundle);
}

export async function updateSettingsForBusiness(businessId, input) {
  assertValidTimeZone(input.timezone);

  const updated = await updateBusinessAndSettings(
    businessId,
    {
      name: input.name,
      businessType: toPrismaBusinessType(input.businessType),
      ownerName: input.ownerName,
      email: input.email,
      phone: input.phone,
      logoUrl: input.logoUrl,
      currency: input.currency,
      orderMode: toPrismaOrderMode(input.orderMode)
    },
    {
      acceptingOrders: input.acceptingOrders,
      showImages: input.showImages,
      showItemDescription: input.showItemDescription,
      showVegBadge: input.showVegBadge,
      timezone: input.timezone
    }
  );

  return {
    business: toBusinessAdminDto(updated.business),
    settings: toSettingsDto(updated.settings)
  };
}
