import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { normalizeSlug } from "../../utils/slug.js";
import { toPrismaSourceType } from "../../utils/enums.js";
import { findBusinessById } from "../businesses/businesses.repository.js";
import { toOrderSourceDto } from "./order-sources.dto.js";
import {
  createOrderSource,
  deleteOrderSource,
  findOrderSourceById,
  findOrderSourceBySlug,
  listOrderSourcesByBusinessId,
  updateOrderSource
} from "./order-sources.repository.js";

function buildQrUrl(businessSlug, sourceSlug) {
  return `${env.PUBLIC_APP_URL.replace(/\/+$/, "")}/menu/${businessSlug}/${sourceSlug}`;
}

async function buildSourcePayload(businessId, input, excludeId) {
  const business = await findBusinessById(businessId);

  if (!business) {
    throw ApiError.notFound("Business not found.");
  }

  const normalizedSlug = normalizeSlug(input.slug || input.name);

  if (!normalizedSlug) {
    throw ApiError.badRequest("Order source slug cannot be empty.");
  }

  const existingSlug = await findOrderSourceBySlug(businessId, normalizedSlug, excludeId);

  if (existingSlug) {
    throw ApiError.conflict("An order source with this slug already exists.");
  }

  return {
    name: input.name,
    slug: normalizedSlug,
    sourceType: toPrismaSourceType(input.sourceType),
    isActive: input.isActive,
    qrUrl: buildQrUrl(business.slug, normalizedSlug)
  };
}

export async function listOrderSources(businessId) {
  const sources = await listOrderSourcesByBusinessId(businessId);
  return sources.map(toOrderSourceDto);
}

export async function createOrderSourceForBusiness(businessId, input) {
  const data = await buildSourcePayload(businessId, input);
  const source = await createOrderSource({
    businessId,
    ...data
  });

  return toOrderSourceDto(source);
}

export async function updateOrderSourceForBusiness(businessId, sourceId, input) {
  const existingSource = await findOrderSourceById(businessId, sourceId);

  if (!existingSource) {
    throw ApiError.notFound("Order source not found.");
  }

  const data = await buildSourcePayload(businessId, input, sourceId);
  const updatedSource = await updateOrderSource(businessId, sourceId, data);

  return toOrderSourceDto(updatedSource);
}

export async function deleteOrderSourceForBusiness(businessId, sourceId) {
  const existingSource = await findOrderSourceById(businessId, sourceId);

  if (!existingSource) {
    throw ApiError.notFound("Order source not found.");
  }

  if (existingSource._count.orders > 0) {
    throw ApiError.conflict("Cannot delete an order source that already has orders.");
  }

  await deleteOrderSource(sourceId);

  return {
    success: true
  };
}

export async function getOrderSourceQrForBusiness(businessId, sourceId) {
  const source = await findOrderSourceById(businessId, sourceId);

  if (!source) {
    throw ApiError.notFound("Order source not found.");
  }

  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    sourceType: toOrderSourceDto(source).sourceType,
    qrUrl: source.qrUrl,
    publicPath: `/menu/${source.business.slug}/${source.slug}`
  };
}
