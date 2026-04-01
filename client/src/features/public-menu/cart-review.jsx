import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency, titleCase } from "@/lib/format";
import { sourceTypeMeta } from "@/lib/status";
import { createPublicOrderRequest, getPublicMenuRequest } from "@/features/public-menu/public-menu-api";
import {
  buildPublicScopeKey,
  persistSuccessfulOrder,
  usePublicCart
} from "@/features/public-menu/public-cart";

export function CartReview() {
  const navigate = useNavigate();
  const { businessSlug, sourceSlug } = useParams();
  const safeBusinessSlug = businessSlug || "";
  const safeSourceSlug = sourceSlug || "";
  const scopeKey = buildPublicScopeKey(safeBusinessSlug, safeSourceSlug);
  const cart = usePublicCart(scopeKey);

  const menuQuery = useQuery({
    queryKey: ["public-menu", businessSlug, sourceSlug],
    queryFn: () => getPublicMenuRequest(safeBusinessSlug, safeSourceSlug),
    enabled: Boolean(businessSlug && sourceSlug),
    staleTime: 30_000
  });

  useEffect(() => {
    if (!menuQuery.data) {
      return;
    }

    const menuItems = menuQuery.data.categories.flatMap((category) => category.items);
    cart.syncWithMenu(menuItems);
  }, [menuQuery.data]);

  const createOrderMutation = useMutation({
    mutationFn: (payload) => createPublicOrderRequest(safeBusinessSlug, safeSourceSlug, payload),
    onSuccess: (order) => {
      persistSuccessfulOrder(scopeKey, {
        ...order,
        businessName: menuQuery.data?.business.name || null,
        currency: menuQuery.data?.business.currency || "INR"
      });
      cart.clearCart();
      navigate(`/menu/${safeBusinessSlug}/${safeSourceSlug}/success`, { replace: true });
    }
  });

  const currency = menuQuery.data?.business.currency || "INR";
  const availableItemsById = menuQuery.data
    ? new Map(
        menuQuery.data.categories.flatMap((category) =>
          category.items.map((item) => [item.id, item])
        )
      )
    : null;
  const orderableItems = availableItemsById
    ? cart.items.filter((item) => availableItemsById.has(item.id))
    : cart.items;
  const unavailableItems = availableItemsById
    ? cart.items.filter((item) => !availableItemsById.has(item.id))
    : [];
  const hasUnavailableItems = availableItemsById ? unavailableItems.length > 0 : false;
  const orderableTotal = orderableItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const isAcceptingOrders = menuQuery.data?.settings.acceptingOrders ?? false;
  const canPlaceOrder =
    orderableItems.length > 0 &&
    !menuQuery.isLoading &&
    !menuQuery.isError &&
    isAcceptingOrders &&
    !hasUnavailableItems &&
    !createOrderMutation.isPending;

  if (!businessSlug || !sourceSlug) {
    return (
      <EmptyState
        title="Cart unavailable"
        description="This QR path is incomplete. Please rescan the table or source QR code."
      />
    );
  }

  function submitOrder() {
    createOrderMutation.mutate({
      customerNote: cart.orderNote.trim() || null,
      items: orderableItems.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        itemNote: item.itemNote?.trim() || null
      }))
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[36px] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(247,240,228,0.92)_56%,rgba(61,46,26,0.96)_100%)] p-6 shadow-glow sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4 text-white">
            <Button asChild className="border-white/20 bg-white/10 text-white hover:bg-white/15" variant="outline">
              <Link to={`/menu/${safeBusinessSlug}/${safeSourceSlug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to menu
              </Link>
            </Button>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/68">
                Review your selection
              </p>
              <h1 className="text-4xl text-white sm:text-5xl">Cart for {menuQuery.data?.source.name || "this source"}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
                Confirm quantities, add notes for the kitchen, and send the order once everything
                looks right.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CartHeroStat label="Items" value={`${cart.itemCount}`} />
            <CartHeroStat
              label="Source"
              value={
                menuQuery.data
                  ? sourceTypeMeta[menuQuery.data.source.sourceType] || titleCase(menuQuery.data.source.sourceType)
                  : "QR"
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          {menuQuery.isLoading ? (
            <div className="rounded-[28px] border border-border/80 bg-white/80 px-5 py-4 text-sm text-muted-foreground">
              Refreshing live menu pricing and availability for this source.
            </div>
          ) : null}

          {menuQuery.isError ? (
            <EmptyState
              title="Live menu unavailable"
              description={getApiErrorMessage(
                menuQuery.error,
                "We could not revalidate this menu. Please refresh or ask the staff for help."
              )}
            />
          ) : null}

          {hasUnavailableItems ? (
            <div className="rounded-[28px] border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <div className="space-y-1">
                  <p className="font-semibold">Some items are no longer available</p>
                  <p className="text-sm leading-6">
                    Remove the highlighted items before placing the order so the kitchen receives a
                    clean ticket.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {cart.items.length ? (
            <div className="space-y-4">
              {cart.items.map((item) => {
                const isUnavailable = availableItemsById ? !availableItemsById.has(item.id) : false;

                return (
                  <article
                    key={item.id}
                    className={`overflow-hidden rounded-[32px] border p-4 shadow-sm ${
                      isUnavailable
                        ? "border-amber-300 bg-amber-50"
                        : "border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,242,232,0.9))]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="h-28 w-full overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(212,184,138,0.56),rgba(255,255,255,0.95)_58%,rgba(246,237,222,0.9)_100%)] sm:w-32">
                        {item.imageUrl ? (
                          <img alt={item.name} className="h-full w-full object-cover" src={item.imageUrl} />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-2xl">{item.name}</h2>
                              {isUnavailable ? (
                                <Badge className="bg-amber-200 text-amber-950">Unavailable</Badge>
                              ) : (
                                <Badge variant="outline">Ready to order</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.price, currency)} each
                            </p>
                          </div>

                          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-white px-2 py-1">
                            <Button
                              className="h-9 w-9"
                              size="icon"
                              type="button"
                              variant="ghost"
                              onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                            <Button
                              className="h-9 w-9"
                              size="icon"
                              type="button"
                              variant="ghost"
                              onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Textarea
                          className="min-h-[90px]"
                          placeholder="Add an item note for the kitchen or service team."
                          value={item.itemNote || ""}
                          onChange={(event) => cart.updateItemNote(item.id, event.target.value)}
                        />

                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{formatCurrency(Number(item.price) * item.quantity, currency)}</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => cart.updateQuantity(item.id, 0)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Your cart is empty"
              description="Add items from the menu before placing an order for this source."
              actionLabel="Return to menu"
              onAction={() => navigate(`/menu/${safeBusinessSlug}/${safeSourceSlug}`)}
            />
          )}
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5 rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))] p-6 shadow-sm">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Order summary
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-4xl">
                    {formatCurrency(orderableTotal, currency)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {orderableItems.length} active line item{orderableItems.length === 1 ? "" : "s"}
                  </p>
                </div>
                {menuQuery.data ? (
                  <Badge variant="outline">{menuQuery.data.source.name}</Badge>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] bg-secondary p-5 text-secondary-foreground">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5" />
                <p className="font-semibold">Server-validated ordering</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-secondary-foreground/78">
                ServeFlow recalculates item availability and totals on the backend before the order
                is accepted.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Order note</p>
              <Textarea
                placeholder="Anything the team should know for the full order?"
                value={cart.orderNote}
                onChange={(event) => cart.setOrderNote(event.target.value)}
              />
            </div>

            {!isAcceptingOrders && menuQuery.data ? (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                This business is not accepting online orders right now.
              </div>
            ) : null}

            {createOrderMutation.isError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {getApiErrorMessage(
                  createOrderMutation.error,
                  "We could not place this order. Please review the cart and try again."
                )}
              </div>
            ) : null}

            <Button className="w-full" disabled={!canPlaceOrder} size="lg" onClick={submitOrder}>
              {createOrderMutation.isPending ? "Placing order..." : "Place secure order"}
            </Button>

            <p className="text-xs leading-6 text-muted-foreground">
              By placing this order, you are sending the selected items directly to the business and
              source shown above.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function CartHeroStat({ label, value }) {
  return (
    <div className="rounded-[28px] border border-white/15 bg-white/10 px-4 py-4 text-white backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/68">{label}</p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}
