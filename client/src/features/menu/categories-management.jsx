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
      title="Categories"
      description="Organize your menu into sections like Starters, Main Course, Drinks, etc."
      actions={
        <Button onClick={resetEditor}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      }
    >
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_350px]">
        <Card className="bg-white/92">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Your Categories</CardTitle>
              <CardDescription>
                {activeCount} active — these show up on your menu.
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
              <>
                {/* Mobile view */}
                <div className="grid gap-3 sm:hidden">
                  {categoriesQuery.data.map((category) => (
                    <div key={category.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-bold text-foreground">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.menuItemCount} dishes · Sort: {category.sortOrder}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            category.isActive
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {category.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => startEditing(category)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view */}
                <div className="hidden sm:block overflow-x-auto">
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
                              <p className="font-bold text-foreground">{category.name}</p>
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
              </>
            ) : (
              <EmptyState
                title="No categories yet"
                description="Add your first category like 'Starters', 'Main Course', or 'Drinks'."
                actionLabel="Add Category"
                onAction={resetEditor}
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))]">
          <CardHeader>
            <CardTitle>{editingCategory ? "Edit Category" : "Add New Category"}</CardTitle>
            <CardDescription>
              Category names appear on your menu that customers see.
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
                  <p className="font-semibold">Show on menu</p>
                  <p className="text-sm text-muted-foreground">
                    Turn off to hide this category from customers.
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
