import { toBusinessAdminDto } from "../businesses/businesses.dto.js";
import { fromPrismaUserRole } from "../../utils/enums.js";

export function toUserDto(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: fromPrismaUserRole(user.role),
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export function toAuthSessionDto({ accessToken, user, business }) {
  const payload = {
    user: toUserDto(user),
    business: toBusinessAdminDto(business),
    permissions: {
      canManageSettings: user.role === "OWNER",
      canManageMenu: user.role === "OWNER",
      canManageSources: user.role === "OWNER",
      canManageOrders: user.role === "OWNER" || user.role === "STAFF"
    }
  };

  if (accessToken) {
    payload.accessToken = accessToken;
  }

  return payload;
}
