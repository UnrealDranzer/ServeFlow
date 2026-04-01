import { ApiError } from "../../utils/api-error.js";
import { toMenuItemDto } from "./menu-items.dto.js";
import {
  createMenuItem,
  deleteMenuItem,
  findActiveCategoryForBusiness,
  findMenuItemById,
  listMenuItemsByBusinessId,
  updateMenuItem
} from "./menu-items.repository.js";

async function assertActiveCategory(businessId, categoryId) {
  const category = await findActiveCategoryForBusiness(businessId, categoryId);

  if (!category) {
    throw ApiError.badRequest("Category must exist and be active within your business.");
  }
}

export async function listMenuItems(businessId, query) {
  const menuItems = await listMenuItemsByBusinessId(businessId, query);
  return menuItems.map(toMenuItemDto);
}

export async function createMenuItemForBusiness(businessId, input) {
  await assertActiveCategory(businessId, input.categoryId);

  const menuItem = await createMenuItem({
    businessId,
    categoryId: input.categoryId,
    name: input.name,
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl,
    isAvailable: input.isAvailable,
    isVeg: input.isVeg,
    sortOrder: input.sortOrder
  });

  return toMenuItemDto(menuItem);
}

export async function updateMenuItemForBusiness(businessId, menuItemId, input) {
  const existingMenuItem = await findMenuItemById(businessId, menuItemId);

  if (!existingMenuItem) {
    throw ApiError.notFound("Menu item not found.");
  }

  await assertActiveCategory(businessId, input.categoryId);

  const updatedMenuItem = await updateMenuItem(businessId, menuItemId, {
    categoryId: input.categoryId,
    name: input.name,
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl,
    isAvailable: input.isAvailable,
    isVeg: input.isVeg,
    sortOrder: input.sortOrder
  });

  return toMenuItemDto(updatedMenuItem);
}

export async function deleteMenuItemForBusiness(businessId, menuItemId) {
  const existingMenuItem = await findMenuItemById(businessId, menuItemId);

  if (!existingMenuItem) {
    throw ApiError.notFound("Menu item not found.");
  }

  if (existingMenuItem._count.orderItems > 0) {
    throw ApiError.conflict("Cannot delete a menu item that exists in historical orders.");
  }

  await deleteMenuItem(menuItemId);

  return {
    success: true
  };
}

export async function updateMenuItemAvailabilityForBusiness(businessId, menuItemId, isAvailable) {
  const existingMenuItem = await findMenuItemById(businessId, menuItemId);

  if (!existingMenuItem) {
    throw ApiError.notFound("Menu item not found.");
  }

  const updatedMenuItem = await updateMenuItem(businessId, menuItemId, {
    isAvailable
  });

  return toMenuItemDto(updatedMenuItem);
}
