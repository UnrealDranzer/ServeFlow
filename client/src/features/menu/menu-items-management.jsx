import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/features/auth/use-auth";
import { getCategoriesRequest } from "@/features/menu/categories-api";
import {
  createMenuItemRequest,
  deleteMenuItemRequest,
  getMenuItemsRequest,
  patchMenuItemAvailabilityRequest,
  updateMenuItemRequest
} from "@/features/menu/menu-items-api";

const initialForm = {
  categoryId: "",
  name: "",
  description: "",
  price: "0.00",
  imageUrl: "",
  isAvailable: true,
  isVeg: false,
  sortOrder: 0
};

export function MenuItemsManagement() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [formState, setFormState] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const categoriesQuery = useQuery({
    queryKey: ["categories", "active"],
    queryFn: () => getCategoriesRequest(true)
  });

  const menuItemsQuery = useQuery({
    queryKey: [
      "menu-items",
      {
        search: deferredSearch,
        categoryFilter,
        availableOnly
      }
    ],
    queryFn: () =>
      getMenuItemsRequest({
        search: deferredSearch || undefined,
        categoryId: categoryFilter || undefined,
        availableOnly
      })
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingMenuItem) {
        return updateMenuItemRequest(editingMenuItem.id, payload);
      }

      return createMenuItemRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      resetEditor();
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to save menu item."));
    }
  });

  const availabilityMutation = useMutation({
    mutationFn: ({ menuItemId, isAvailable }) =>
      patchMenuItemAvailabilityRequest(menuItemId, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItemRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      if (editingMenuItem) {
        resetEditor();
      }
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete menu item."));
    }
  });

  const currency = auth.business?.currency || "INR";

  function resetEditor() {
    setEditingMenuItem(null);
    setErrorMessage("");
    setFormState({
      ...initialForm,
      categoryId: categoriesQuery.data?.[0]?.id || ""
    });
  }

  function startEditing(menuItem) {
    setEditingMenuItem(menuItem);
    setErrorMessage("");
    setFormState({
      categoryId: menuItem.category?.id || "",
      name: menuItem.name,
      description: menuItem.description || "",
      price: menuItem.price,
      imageUrl: menuItem.imageUrl || "",
      isAvailable: menuItem.isAvailable,
      isVeg: menuItem.isVeg,
      sortOrder: menuItem.sortOrder
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    saveMutation.mutate({
      categoryId: formState.categoryId,
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      price: formState.price,
      imageUrl: formState.imageUrl.trim() || null,
      isAvailable: formState.isAvailable,
      isVeg: formState.isVeg,
      sortOrder: Number(formState.sortOrder)
    });
  }

  function handleDelete(menuItem) {
    const confirmed = window.confirm(
      `Delete "${menuItem.name}"? This is blocked automatically if historical orders already reference it.`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    deleteMutation.mutate(menuItem.id);
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional: add loading state here if desired

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        let width = img.width;
        let height = img.height;
        const maxDim = 500;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75); // compresses nicely for db
        setFormState((currentState) => ({
          ...currentState,
          imageUrl: dataUrl
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset the input so the same file can be selected again if removed
    event.target.value = "";
  };

  return (
    <PageShell
      title="Dishes"
      description="Add, edit, and manage all the food and drinks you sell."
      actions={
        <Button onClick={resetEditor}>
          <Plus className="mr-2 h-4 w-4" />
          New Item
        </Button>
      }
    >
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,240,228,0.95))]">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                  Search or filter to find dishes quickly.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
              <div className="space-y-2">
                <Label htmlFor="menuItemSearch">Search</Label>
                <Input
                  id="menuItemSearch"
                  placeholder="Search for coffee, croissant, biryani..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryFilter">Category</Label>
                <Select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="">All categories</option>
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex w-full items-center justify-between rounded-3xl border border-border/80 bg-white/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Available only</p>
                    <p className="text-xs text-muted-foreground">Hide unavailable items</p>
                  </div>
                  <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/92">
            <CardHeader>
              <CardTitle>All Dishes</CardTitle>
              <CardDescription>
                Your full menu — tap any dish to edit or delete it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuItemsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : menuItemsQuery.isError ? (
                <EmptyState
                  title="Menu items could not be loaded"
                  description={getApiErrorMessage(
                    menuItemsQuery.error,
                    "The menu catalogue is currently unavailable."
                  )}
                />
              ) : menuItemsQuery.data?.length ? (
              <>
                {/* Mobile view */}
                <div className="grid gap-3 sm:hidden">
                  {menuItemsQuery.data.map((menuItem) => (
                    <div key={menuItem.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{menuItem.name}</p>
                            {menuItem.isVeg ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 uppercase">
                                Veg
                              </span>
                            ) : null}
                          </div>
                          <p className="font-bold text-sm">{formatCurrency(menuItem.price, currency)}</p>
                          <p className="text-xs text-muted-foreground">{menuItem.category?.name || "No category"}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {menuItem.isAvailable ? "Live on Menu" : "Hidden"}
                        </span>
                        <div className="ml-auto">
                          <Switch
                            checked={menuItem.isAvailable}
                            onCheckedChange={(checked) =>
                              availabilityMutation.mutate({
                                menuItemId: menuItem.id,
                                isAvailable: checked
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 font-bold"
                          onClick={() => startEditing(menuItem)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(menuItem)}
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
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItemsQuery.data.map((menuItem) => (
                        <TableRow key={menuItem.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold">{menuItem.name}</p>
                                {menuItem.isVeg ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                                    Veg
                                  </span>
                                ) : null}
                              </div>
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {menuItem.description || "No description added."}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{menuItem.category?.name || "-"}</TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(menuItem.price, currency)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={menuItem.isAvailable}
                                onCheckedChange={(checked) =>
                                  availabilityMutation.mutate({
                                    menuItemId: menuItem.id,
                                    isAvailable: checked
                                  })
                                }
                              />
                              <span className="text-sm font-semibold text-muted-foreground">
                                {menuItem.isAvailable ? "Live" : "Hidden"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(menuItem)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDelete(menuItem)}
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
                  title="No menu items match this view"
                  description="Create the first item or relax the filters to see more of the current menu."
                  actionLabel="Create menu item"
                  onAction={resetEditor}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))]">
          <CardHeader>
            <CardTitle>{editingMenuItem ? "Edit Dish" : "Add New Dish"}</CardTitle>
            <CardDescription>
              Fill in the details below. The name and price will show to customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border border-border/70 bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Tip</p>
                  <p className="text-sm text-muted-foreground">
                    Keep descriptions short. A photo and a clear name work best for customers.
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="menuItemCategory">Category</Label>
                <Select
                  id="menuItemCategory"
                  value={formState.categoryId}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      categoryId: event.target.value
                    }))
                  }
                  required
                >
                  <option value="">Select category</option>
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="menuItemName">Item name</Label>
                <Input
                  id="menuItemName"
                  placeholder="Saffron Rose Latte"
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="menuItemPrice">Price</Label>
                  <Input
                    id="menuItemPrice"
                    inputMode="decimal"
                    placeholder="249.00"
                    value={formState.price}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        price: event.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menuItemSortOrder">Sort order</Label>
                  <Input
                    id="menuItemSortOrder"
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="menuItemDescription">Description</Label>
                <Textarea
                  id="menuItemDescription"
                  placeholder="A fragrant milk brew finished with saffron threads and dried rose petals."
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      description: event.target.value
                    }))
                  }
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="menuItemImage">Image</Label>
                <div className="flex flex-col gap-3">
                  {formState.imageUrl && (
                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formState.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                        onClick={() => setFormState(s => ({ ...s, imageUrl: "" }))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="image-upload"
                      className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Upload / Take Photo
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-muted-foreground w-full text-center uppercase font-bold tracking-widest">or</span>
                    </div>
                    <Input
                      placeholder="Paste Image URL here instead..."
                      value={formState.imageUrl}
                      onChange={(event) =>
                        setFormState((currentState) => ({
                          ...currentState,
                          imageUrl: event.target.value
                        }))
                      }
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-3xl border border-border/80 bg-white/80 p-4">
                <ToggleRow
                  label="Available now"
                  description="Turn off to hide this dish from customers and order screens."
                  checked={formState.isAvailable}
                  onCheckedChange={(checked) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      isAvailable: checked
                    }))
                  }
                />
                <ToggleRow
                  label="Veg badge"
                  description="Show a green dot on the menu if this dish is vegetarian."
                  checked={formState.isVeg}
                  onCheckedChange={(checked) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      isVeg: checked
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
                <Button type="submit" disabled={saveMutation.isPending || categoriesQuery.isLoading}>
                  {saveMutation.isPending
                    ? "Saving..."
                    : editingMenuItem
                      ? "Update Menu Item"
                      : "Create Menu Item"}
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

function ToggleRow({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
