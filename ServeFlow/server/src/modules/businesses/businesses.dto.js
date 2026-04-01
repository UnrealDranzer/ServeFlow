import { fromPrismaBusinessType, fromPrismaOrderMode } from "../../utils/enums.js";

export function toBusinessAdminDto(business) {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    businessType: fromPrismaBusinessType(business.businessType),
    ownerName: business.ownerName,
    email: business.email,
    phone: business.phone,
    logoUrl: business.logoUrl,
    currency: business.currency,
    orderMode: fromPrismaOrderMode(business.orderMode),
    isActive: business.isActive,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString()
  };
}

export function toBusinessPublicDto(business) {
  return {
    name: business.name,
    slug: business.slug,
    businessType: fromPrismaBusinessType(business.businessType),
    logoUrl: business.logoUrl,
    currency: business.currency,
    orderMode: fromPrismaOrderMode(business.orderMode)
  };
}
