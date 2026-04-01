import { sendSuccess } from "../../utils/responses.js";
import { requireBusinessId } from "../../utils/tenant-context.js";
import {
  createOrderSourceForBusiness,
  deleteOrderSourceForBusiness,
  getOrderSourceQrForBusiness,
  listOrderSources,
  updateOrderSourceForBusiness
} from "./order-sources.service.js";

export async function listOrderSourcesController(req, res) {
  const businessId = requireBusinessId(req);
  const sources = await listOrderSources(businessId);

  sendSuccess(res, sources);
}

export async function createOrderSourceController(req, res) {
  const businessId = requireBusinessId(req);
  const source = await createOrderSourceForBusiness(businessId, req.body);

  sendSuccess(res, source, { statusCode: 201 });
}

export async function updateOrderSourceController(req, res) {
  const businessId = requireBusinessId(req);
  const source = await updateOrderSourceForBusiness(businessId, req.params.id, req.body);

  sendSuccess(res, source);
}

export async function deleteOrderSourceController(req, res) {
  const businessId = requireBusinessId(req);
  const result = await deleteOrderSourceForBusiness(businessId, req.params.id);

  sendSuccess(res, result);
}

export async function getOrderSourceQrController(req, res) {
  const businessId = requireBusinessId(req);
  const qrData = await getOrderSourceQrForBusiness(businessId, req.params.id);

  sendSuccess(res, qrData);
}
