import { sendSuccess } from "../../utils/responses.js";
import { requireAuthContext, requireBusinessId } from "../../utils/tenant-context.js";
import {
  createManualOrderForBusiness,
  getOrderDetails,
  listOrders,
  updateOrderStatusForBusiness
} from "./orders.service.js";

export async function listOrdersController(req, res) {
  const businessId = requireBusinessId(req);
  const orders = await listOrders(businessId, req.query);

  sendSuccess(res, orders);
}

export async function getOrderController(req, res) {
  const businessId = requireBusinessId(req);
  const order = await getOrderDetails(businessId, req.params.id);

  sendSuccess(res, order);
}

export async function createManualOrderController(req, res) {
  const auth = requireAuthContext(req);
  const order = await createManualOrderForBusiness(auth.businessId, auth.userId, req.body);

  sendSuccess(res, order, { statusCode: 201 });
}

export async function updateOrderStatusController(req, res) {
  const businessId = requireBusinessId(req);
  const order = await updateOrderStatusForBusiness(businessId, req.params.id, req.body.status);

  sendSuccess(res, order);
}
