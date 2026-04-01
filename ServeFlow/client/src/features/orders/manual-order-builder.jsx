import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ReceiptText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/features/auth/use-auth";
import { getMenuItemsRequest } from "@/features/menu/menu-items-api";
import { getOrderSourcesRequest } from "@/features/sources/sources-api";
import { createManualOrderRequest } from "@/features/orders/orders-api";

export function ManualOrderBuilder() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [itemNotes, setItemNotes] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const deferredSearch = useDeferredValue(search);

  const sourcesQuery = useQuery({
    queryKey: ["order-sources"],
    queryFn: getOrderSourcesRequest
  });

  const menuItemsQuery = useQuery({
    queryKey: ["menu-items", "manual-order", deferredSearch],
    queryFn: () =>
      getMenuItemsRequest({
        availableOnly: true,
        search: deferredSearch || undefined
      })
  });

  const createOrderMutation = useMutation({
    mutationFn: createManualOrderRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/app/orders");
    }
  });

  const activeSources = sourcesQuery.data?.filter((source) => source.isActive) || [];
  const currency = auth.business?.currency || "INR";
  const total = selectedItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  function addItem(menuItem) {
    setSelectedItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === menuItem.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentItems, { ...menuItem, quantity: 1 }];
    });
  }

  function updateQuantity(menuItemId, nextQuantity) {
    if (nextQuantity <= 0) {
      setSelectedItems((currentItems) => currentItems.filter((item) => item.id !== menuItemId));
      return;
    }

    setSelectedItems((currentItems) =>
      currentItems.map((item) =>
        item.id === menuItemId ? { ...item, quantity: nextQuantity } : item
      )
    );
  }

  function submitOrder() {
    createOrderMutation.mutate({
      sourceId,
      customerNote: customerNote.trim() || null,
      items: selectedItems.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        itemNote: itemNotes[item.id]?.trim() || null
      }))
    });
  }

  return (
    <PageShell
      title="New Manual Order"
      description="Build a polished staff order flow for tables, counters, takeaway, and parcel service."
    >
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,240,228,0.94))]">
            <CardHeader>
              <CardTitle>Order Setup</CardTitle>
              <CardDescription>
                Choose the source first, then compose the order with only currently available menu items.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="manualSource">Order source</Label>
                <Select id="manualSource" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
                  <option value="">Select source</option>
                  {activeSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualSearch">Menu search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="manualSearch"
                    className="pl-11"
                    placeholder="Search available items..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/92">
            <CardHeader>
              <CardTitle>Available Menu</CardTitle>
              <CardDescription>
                Only currently available items appear here, matching what the backend allows for manual orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuItemsQuery.isLoading ? (
                <LoadingCards />
              ) : menuItemsQuery.isError ? (
                <EmptyState
                  title="Menu items unavailable"
                  description={getApiErrorMessage(
                    menuItemsQuery.error,
                    "Available items could not be loaded."
                  )}
                />
              ) : menuItemsQuery.data?.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {menuItemsQuery.data.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      type="button"
                      className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.88))] p-4 text-left transition-transform hover:-translate-y-0.5 hover:shadow-sm"
                      onClick={() => addItem(menuItem)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{menuItem.name}</p>
                            {menuItem.isVeg ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                                Veg
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {menuItem.description || "No description added."}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(menuItem.price, currency)}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {menuItem.category?.name}
                        </p>
                        <span className="text-sm font-semibold text-primary">Add to order</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No available items found"
                  description="Check availability settings or change the search term to build the order."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Order Composition</CardTitle>
                <CardDescription>
                  Build the active ticket with item quantities, notes, and a final customer note.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedItems.length ? (
              <div className="space-y-4">
                {selectedItems.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-border/70 bg-white/80 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatCurrency(item.price, currency)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-white px-2 py-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`note-${item.id}`}>Item note</Label>
                      <Textarea
                        id={`note-${item.id}`}
                        className="min-h-[90px]"
                        placeholder="Extra spicy, no onions, add cutlery..."
                        value={itemNotes[item.id] || ""}
                        onChange={(event) =>
                          setItemNotes((currentNotes) => ({
                            ...currentNotes,
                            [item.id]: event.target.value
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Order is empty"
                description="Tap items from the available menu to begin building a manual order."
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="customerNote">Order note</Label>
              <Textarea
                id="customerNote"
                placeholder="General note for the kitchen or service team."
                value={customerNote}
                onChange={(event) => setCustomerNote(event.target.value)}
              />
            </div>

            <div className="rounded-[28px] bg-secondary p-5 text-secondary-foreground">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-foreground/70">
                Current Total
              </p>
              <p className="mt-3 font-display text-4xl">{formatCurrency(total, currency)}</p>
              <p className="mt-2 text-sm text-secondary-foreground/75">
                Taxes and discounts are controlled server-side. This preview mirrors the current item prices.
              </p>
            </div>

            {createOrderMutation.isError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {getApiErrorMessage(createOrderMutation.error, "Unable to create manual order.")}
              </div>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              disabled={!sourceId || !selectedItems.length || createOrderMutation.isPending}
              onClick={submitOrder}
            >
              {createOrderMutation.isPending ? "Placing order..." : "Place Manual Order"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-[28px] bg-muted" />
      ))}
    </div>
  );
}
