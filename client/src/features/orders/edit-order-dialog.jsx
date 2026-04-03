import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/features/auth/use-auth";
import { getMenuItemsRequest } from "@/features/menu/menu-items-api";
import { editOrderItemsRequest } from "@/features/orders/orders-api";

export function EditOrderDialog({ order, onClose, onSuccess }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const currency = auth.business?.currency || "INR";

  const [search, setSearch] = useState("");
  const [customerNote, setCustomerNote] = useState(order.customerNote || "");
  const [itemNotes, setItemNotes] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const deferredSearch = useDeferredValue(search);

  // Seed selected items from existing order
  useEffect(() => {
    if (order?.items?.length) {
      const existing = order.items.map((item) => ({
        id: item.menuItemId,
        name: item.itemNameSnapshot,
        price: item.itemPriceSnapshot,
        quantity: item.quantity
      }));
      setSelectedItems(existing);

      const notes = {};
      order.items.forEach((item) => {
        if (item.itemNote) {
          notes[item.menuItemId] = item.itemNote;
        }
      });
      setItemNotes(notes);
    }
  }, [order]);

  const menuItemsQuery = useQuery({
    queryKey: ["menu-items", "edit-order", deferredSearch],
    queryFn: () =>
      getMenuItemsRequest({
        availableOnly: true,
        search: deferredSearch || undefined
      })
  });

  const editMutation = useMutation({
    mutationFn: (payload) => editOrderItemsRequest(order.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onSuccess?.(data);
      onClose();
    }
  });

  const total = selectedItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  function addItem(menuItem) {
    setSelectedItems((current) => {
      const existing = current.find((item) => item.id === menuItem.id);
      if (existing) {
        return current.map((item) =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  }

  function updateQuantity(menuItemId, nextQuantity) {
    if (nextQuantity <= 0) {
      setSelectedItems((current) => current.filter((item) => item.id !== menuItemId));
      return;
    }
    setSelectedItems((current) =>
      current.map((item) =>
        item.id === menuItemId ? { ...item, quantity: nextQuantity } : item
      )
    );
  }

  function handleSave() {
    editMutation.mutate({
      customerNote: customerNote.trim() || null,
      items: selectedItems.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        itemNote: itemNotes[item.id]?.trim() || null
      }))
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Order #{order.id.slice(0, 8)}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Add, remove, or change items — total recalculates automatically.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr] max-h-[70vh] overflow-hidden">
          {/* Left — Menu items */}
          <div className="border-r overflow-y-auto p-5 space-y-4" style={{ maxHeight: "70vh" }}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10 h-10"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {menuItemsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : menuItemsQuery.data?.length ? (
              <div className="space-y-2">
                {menuItemsQuery.data.map((menuItem) => {
                  const inCart = selectedItems.find((si) => si.id === menuItem.id);
                  return (
                    <button
                      key={menuItem.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-white p-3 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                      onClick={() => addItem(menuItem)}
                    >
                      <div>
                        <p className="font-semibold text-sm text-foreground">{menuItem.name}</p>
                        <p className="text-[10px] text-muted-foreground">{menuItem.category?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {inCart ? (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {inCart.quantity} in order
                          </span>
                        ) : null}
                        <span className="font-bold text-sm">{formatCurrency(menuItem.price, currency)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No items found" description="Try a different search term." />
            )}
          </div>

          {/* Right — Current order */}
          <div className="overflow-y-auto p-5 space-y-4" style={{ maxHeight: "70vh" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
              Order Items ({selectedItems.length})
            </p>

            {selectedItems.length ? (
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/40 bg-muted/10 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatCurrency(item.price, currency)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-md bg-white border p-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 rounded-sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 rounded-sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Item note (optional)"
                      value={itemNotes[item.id] || ""}
                      onChange={(e) =>
                        setItemNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6">
                <EmptyState title="No items" description="Add items from the menu on the left." />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Order Note
              </Label>
              <Textarea
                className="min-h-[60px] text-sm"
                placeholder="Any special instructions?"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Updated Total
              </p>
              <p className="mt-1 font-display text-2xl font-bold">{formatCurrency(total, currency)}</p>
            </div>

            {editMutation.isError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-medium text-destructive">
                {getApiErrorMessage(editMutation.error, "Could not update order.")}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t p-5">
          <Button variant="ghost" onClick={onClose} disabled={editMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedItems.length || editMutation.isPending}
            className="font-bold"
          >
            <Save className="mr-2 h-4 w-4" />
            {editMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
