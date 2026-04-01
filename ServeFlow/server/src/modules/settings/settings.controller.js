import { requireBusinessId } from "../../utils/tenant-context.js";
import { sendSuccess } from "../../utils/responses.js";
import { getSettingsForBusiness, updateSettingsForBusiness } from "./settings.service.js";

export async function getSettingsController(req, res) {
  const businessId = requireBusinessId(req);
  const settings = await getSettingsForBusiness(businessId);

  sendSuccess(res, settings);
}

export async function updateSettingsController(req, res) {
  const businessId = requireBusinessId(req);
  const settings = await updateSettingsForBusiness(businessId, req.body);

  sendSuccess(res, settings);
}
