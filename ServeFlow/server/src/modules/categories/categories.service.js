import { ApiError } from "../../utils/api-error.js";
import { toCategoryDto } from "./categories.dto.js";
import {
  createCategory,
  deleteCategory,
  findCategoryById,
  findCategoryByName,
  listCategoriesByBusinessId,
  updateCategory
} from "./categories.repository.js";

async function assertUniqueCategoryName(businessId, name, excludeId) {
  const existingCategory = await findCategoryByName(businessId, name, excludeId);

  if (existingCategory) {
    throw ApiError.conflict("A category with this name already exists.");
  }
}

export async function listCategories(businessId, query) {
  const categories = await listCategoriesByBusinessId(businessId, query);
  return categories.map(toCategoryDto);
}

export async function createCategoryForBusiness(businessId, input) {
  await assertUniqueCategoryName(businessId, input.name);

  const category = await createCategory({
    businessId,
    name: input.name,
    sortOrder: input.sortOrder,
    isActive: input.isActive
  });

  return toCategoryDto(category);
}

export async function updateCategoryForBusiness(businessId, categoryId, input) {
  const existingCategory = await findCategoryById(businessId, categoryId);

  if (!existingCategory) {
    throw ApiError.notFound("Category not found.");
  }

  await assertUniqueCategoryName(businessId, input.name, categoryId);

  const updatedCategory = await updateCategory(businessId, categoryId, {
    name: input.name,
    sortOrder: input.sortOrder,
    isActive: input.isActive
  });

  return toCategoryDto(updatedCategory);
}

export async function deleteCategoryForBusiness(businessId, categoryId) {
  const existingCategory = await findCategoryById(businessId, categoryId);

  if (!existingCategory) {
    throw ApiError.notFound("Category not found.");
  }

  if (existingCategory._count.menuItems > 0) {
    throw ApiError.conflict("Cannot delete a category that still has menu items.");
  }

  await deleteCategory(categoryId);

  return {
    success: true
  };
}
