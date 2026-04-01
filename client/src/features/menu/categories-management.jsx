import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createCategoryRequest,
  deleteCategoryRequest,
  getCategoriesRequest,
  updateCategoryRequest
} from "@/features/menu/categories-api";

const initialForm = {
  name: "",
  sortOrder: 0,
  isActive: true
};

export function CategoriesManagement() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState(null);
  const [formState, setFormState] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategoriesRequest(false)
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCategory) {
        return updateCategoryRequest(editingCategory.id, payload);
      }

      return createCategoryRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetEditor();
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to save category."));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategoryRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (editingCategory) {
        resetEditor();
      }
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete category."));
    }
  });

  const activeCount = categoriesQuery.data?.filter((category) => category.isActive).length || 0;

  function resetEditor() {
    setEditingCategory(null);
    setFormState(initialForm);
    setErrorMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    saveMutation.mutate({
      name: formState.name.trim(),
      sortOrder: Number(formState.sortOrder),
      isActive: formState.isActive
    });
  }

  function startEditing(category) {
    setEditingCategory(category);
    setFormState({
      name: category.name,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    setErrorMessage("");
  }

  function handleDelete(category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This will be blocked if menu items still belong to it.`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    deleteMutation.mutate(category.id);
  }

  return (
    <PageShell
      title="Category Management"
      description="Shape the dining catalogue with refined sections, clean sort order, and activation controls."
      actions={
        <Button onClick={resetEditor}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/92">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Category List</CardTitle>
              <CardDescription>
                {activeCount} active categories across the current menu structure.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : categoriesQuery.isError ? (
              <EmptyState
                title="Categories could not be loaded"
                description={getApiErrorMessage(
                  categoriesQuery.error,
                  "The category list is currently unavailable."
                )}
              />
            ) : categoriesQuery.data?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Menu Items</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoriesQuery.data.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(category.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{category.menuItemCount}</TableCell>
                        <TableCell>{category.sortOrder}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              category.isActive
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-stone-200 text-stone-700"
                            }`}
                          >
                            {category.isActive ? "Active" : "Hidden"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(category)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(category)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="No categories yet"
                description="Start by creating a polished category structure for starters, beverages, bakery, or main dishes."
                actionLabel="Create first category"
                onAction={resetEditor}
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))]">
          <CardHeader>
            <CardTitle>{editingCategory ? "Edit Category" : "Create Category"}</CardTitle>
            <CardDescription>
              Keep naming clean and deliberate. This structure shapes both admin operations and the
              public QR browsing experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category name</Label>
                <Input
                  id="categoryName"
                  placeholder="Breakfast Signatures"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      name: event.target.value
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formState.sortOrder}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      sortOrder: event.target.value
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-border/80 bg-white/80 px-4 py-4">
                <div>
                  <p className="font-semibold">Visible to staff and customers</p>
                  <p className="text-sm text-muted-foreground">
                    Inactive categories stay hidden from the active public menu.
                  </p>
                </div>
                <Switch
                  checked={formState.isActive}
                  onCheckedChange={(checked) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      isActive: checked
                    }))
                  }
                />
              </div>
              {errorMessage ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </Button>
                <Button type="button" variant="outline" onClick={resetEditor}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
