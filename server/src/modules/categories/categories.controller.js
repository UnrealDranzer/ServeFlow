import { sendSuccess } from "../../utils/responses.js";
import { requireBusinessId } from "../../utils/tenant-context.js";
import {
  createCategoryForBusiness,
  deleteCategoryForBusiness,
  listCategories,
  updateCategoryForBusiness
} from "./categories.service.js";

export async function listCategoriesController(req, res) {
  const businessId = requireBusinessId(req);
  const categories = await listCategories(businessId, req.query);

  sendSuccess(res, categories);
}

export async function createCategoryController(req, res) {
  const businessId = requireBusinessId(req);
  const category = await createCategoryForBusiness(businessId, req.body);

  sendSuccess(res, category, { statusCode: 201 });
}

export async function updateCategoryController(req, res) {
  const businessId = requireBusinessId(req);
  const category = await updateCategoryForBusiness(businessId, req.params.id, req.body);

  sendSuccess(res, category);
}

export async function deleteCategoryController(req, res) {
  const businessId = requireBusinessId(req);
  const result = await deleteCategoryForBusiness(businessId, req.params.id);

  sendSuccess(res, result);
}
