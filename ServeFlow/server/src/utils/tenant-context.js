import { ApiError } from "./api-error.js";

export function requireAuthContext(req) {
  if (!req.auth) {
    throw ApiError.unauthorized("Authentication required.");
  }

  return req.auth;
}

export function requireBusinessId(req) {
  return requireAuthContext(req).businessId;
}

export function withTenantScope(businessId, where = {}) {
  return {
    ...where,
    businessId
  };
}

export function withTenantData(businessId, data = {}) {
  return {
    ...data,
    businessId
  };
}
