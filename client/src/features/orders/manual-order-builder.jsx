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
      title="New Order"
      description="Pick a table and add dishes to send to the kitchen."
    >
      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-none bg-muted/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg font-bold">1. Pick a Table</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[240px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="manualSource" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Table / Source</Label>
                <Select id="manualSource" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
                  <option value="">Choose table...</option>
                  {activeSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualSearch" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Search Items</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="manualSearch"
                    className="pl-11 h-11"
                    placeholder="Type to find food/drinks..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg font-bold">2. Add Dishes</CardTitle>
            </CardHeader>
            <CardContent>
              {menuItemsQuery.isLoading ? (
                <LoadingCards />
              ) : menuItemsQuery.isError ? (
                <EmptyState
                  title="Menu unavailable"
                  description={getApiErrorMessage(
                    menuItemsQuery.error,
                    "Available items could not be loaded."
                  )}
                />
              ) : menuItemsQuery.data?.length ? (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {menuItemsQuery.data.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      type="button"
                      className="group flex flex-col justify-between rounded-xl border border-border/50 bg-white p-4 text-left transition-all hover:border-primary/30 hover:shadow-md"
                      onClick={() => addItem(menuItem)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground leading-tight">{menuItem.name}</p>
                            {menuItem.isVeg ? (
                              <div className="h-2 w-2 rounded-full bg-emerald-500" title="Veg" />
                            ) : null}
                          </div>
                          <p className="line-clamp-1 text-[11px] font-medium text-muted-foreground">
                            {menuItem.description || "No description."}
                          </p>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency(menuItem.price, currency)}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                          {menuItem.category?.name}
                        </p>
                        <span className="text-xs font-bold text-primary group-hover:underline">Add to Order</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No items found"
                  description="Try a different search or check your menu sections."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none bg-muted/10 shadow-sm border-l border-border/30 h-fit sticky top-6">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold">Current Order</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {selectedItems.length ? (
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4 border-b border-border/20 pb-3 mb-3">
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {formatCurrency(item.price, currency)} / unit
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`note-${item.id}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Preparation Note</Label>
                      <Input
                        id={`note-${item.id}`}
                        className="h-8 text-xs"
                        placeholder="e.g. Extra spicy, No onion..."
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
              <div className="py-10">
                <EmptyState
                  title="Empty Cart"
                  description="Choose items from the left to start."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerNote" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">ORDER NOTE</Label>
              <Textarea
                id="customerNote"
                className="min-h-[80px] text-sm"
                placeholder="Any special instructions for the whole order?"
                value={customerNote}
                onChange={(event) => setCustomerNote(event.target.value)}
              />
            </div>

            <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                TOTAL BILL
              </p>
              <p className="mt-1 font-display text-4xl font-bold">{formatCurrency(total, currency)}</p>
            </div>

            {createOrderMutation.isError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-medium text-destructive">
                {getApiErrorMessage(createOrderMutation.error, "Error creating order.")}
              </div>
            ) : null}

            <Button
              className="w-full text-sm font-bold uppercase tracking-wider"
              size="lg"
              disabled={!sourceId || !selectedItems.length || createOrderMutation.isPending}
              onClick={submitOrder}
            >
              {createOrderMutation.isPending ? "SENDING..." : "SEND ORDER"}
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
