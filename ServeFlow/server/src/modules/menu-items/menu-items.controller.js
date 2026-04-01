import { sendSuccess } from "../../utils/responses.js";
import { requireBusinessId } from "../../utils/tenant-context.js";
import {
  createMenuItemForBusiness,
  deleteMenuItemForBusiness,
  listMenuItems,
  updateMenuItemAvailabilityForBusiness,
  updateMenuItemForBusiness
} from "./menu-items.service.js";

export async function listMenuItemsController(req, res) {
  const businessId = requireBusinessId(req);
  const menuItems = await listMenuItems(businessId, req.query);

  sendSuccess(res, menuItems);
}

export async function createMenuItemController(req, res) {
  const businessId = requireBusinessId(req);
  const menuItem = await createMenuItemForBusiness(businessId, req.body);

  sendSuccess(res, menuItem, { statusCode: 201 });
}

export async function updateMenuItemController(req, res) {
  const businessId = requireBusinessId(req);
  const menuItem = await updateMenuItemForBusiness(businessId, req.params.id, req.body);

  sendSuccess(res, menuItem);
}

export async function deleteMenuItemController(req, res) {
  const businessId = requireBusinessId(req);
  const result = await deleteMenuItemForBusiness(businessId, req.params.id);

  sendSuccess(res, result);
}

export async function patchMenuItemAvailabilityController(req, res) {
  const businessId = requireBusinessId(req);
  const menuItem = await updateMenuItemAvailabilityForBusiness(
    businessId,
    req.params.id,
    req.body.isAvailable
  );

  sendSuccess(res, menuItem);
}
