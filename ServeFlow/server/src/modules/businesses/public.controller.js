import { sendSuccess } from "../../utils/responses.js";
import { createPublicOrder, getPublicMenu } from "./public.service.js";

export async function getPublicMenuController(req, res) {
  const menu = await getPublicMenu(req.params.businessSlug, req.params.sourceSlug);
  sendSuccess(res, menu);
}

export async function createPublicOrderController(req, res) {
  const order = await createPublicOrder(req.params.businessSlug, req.params.sourceSlug, req.body);
  sendSuccess(res, order, { statusCode: 201 });
}
