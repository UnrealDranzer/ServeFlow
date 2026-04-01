import { sendSuccess } from "../../utils/responses.js";
import { getAuthenticatedUser, loginUser, logoutUser, refreshUserSession } from "./auth.service.js";

export async function loginController(req, res) {
  const payload = await loginUser(req.body, req, res);
  sendSuccess(res, payload);
}

export async function refreshController(req, res) {
  const payload = await refreshUserSession(req, res);
  sendSuccess(res, payload);
}

export async function meController(req, res) {
  const payload = await getAuthenticatedUser(req);
  sendSuccess(res, payload);
}

export async function logoutController(req, res) {
  const payload = await logoutUser(req, res);
  sendSuccess(res, payload);
}
