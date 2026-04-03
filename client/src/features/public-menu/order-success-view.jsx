import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ReceiptText, Sparkles } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency, titleCase } from "@/lib/format";
import { sourceTypeMeta } from "@/lib/status";
import { getPublicMenuRequest } from "@/features/public-menu/public-menu-api";
import { buildPublicScopeKey, readSuccessfulOrder } from "@/features/public-menu/public-cart";

export function OrderSuccessView() {
  const navigate = useNavigate();
  const { businessSlug, sourceSlug } = useParams();
  const scopeKey = buildPublicScopeKey(businessSlug, sourceSlug);
  const [lastOrder] = useState(() => readSuccessfulOrder(scopeKey));

  const menuQuery = useQuery({
    queryKey: ["public-menu", businessSlug, sourceSlug],
    queryFn: () => getPublicMenuRequest(businessSlug, sourceSlug),
    enabled: Boolean(businessSlug && sourceSlug),
    staleTime: 30_000
  });

  if (!businessSlug || !sourceSlug) {
    return (
      <EmptyState
        title="Confirmation unavailable"
        description="This QR confirmation path is incomplete. Please rescan the business QR code."
      />
    );
  }

  if (!lastOrder) {
    return (
      <div className="space-y-6">
        {menuQuery.isError ? (
          <EmptyState
            title="Order confirmation unavailable"
            description={getApiErrorMessage(
              menuQuery.error,
              "We could not recover the latest order details for this source."
            )}
          />
        ) : null}

        <EmptyState
          title="No recent order found for this source"
          description="If you just placed an order from another tab or device, please check with the staff."
          actionLabel="Return to menu"
          onAction={() => navigate(`/menu/${businessSlug}/${sourceSlug}`)}
        />
      </div>
    );
  }

  const currency = lastOrder.currency || menuQuery.data?.business.currency || "INR";
  const sourceName = lastOrder.source?.name || menuQuery.data?.source.name || "this source";
  const orderAction = lastOrder.action || "created";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[36px] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(247,240,228,0.92)_54%,rgba(61,46,26,0.96)_100%)] p-6 shadow-glow sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge className="bg-emerald-100 text-emerald-900">Order placed</Badge>
            <div className="space-y-3">
              <h1 className="text-4xl text-foreground sm:text-5xl">
                {orderAction === "updated" ? "Your items were added to the current order" : "Your order is with the team"}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-foreground/74 sm:text-base">
                Thank you for ordering from {lastOrder.businessName || menuQuery.data?.business.name || "ServeFlow"}.
                {orderAction === "updated"
                  ? ` The table's active order has been updated for ${sourceName}.`
                  : ` The business can now manage this order from the live dashboard for ${sourceName}.`}
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/82 p-6 text-foreground shadow-sm backdrop-blur">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/62">
              Reference
            </p>
            <p className="mt-2 font-display text-4xl">#{lastOrder.orderId.slice(0, 8)}</p>
            <p className="mt-2 text-sm text-foreground/72">{formatGuestDateTime(lastOrder.placedAt)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Order summary
                </p>
                <p className="font-semibold">{sourceName}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SummaryCard label="Status" value={titleCase(lastOrder.status)} />
              <SummaryCard label="Total" value={formatCurrency(lastOrder.total, currency)} />
            </div>

            <div className="mt-5 rounded-[28px] bg-secondary p-5 text-secondary-foreground">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <p className="font-semibold">What happens next</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-secondary-foreground/78">
                The business team can now accept, prepare, and complete your order from the
                secured ServeFlow operations dashboard.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to={`/menu/${businessSlug}/${sourceSlug}`}>
                  Order more items
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/menu/${businessSlug}/${sourceSlug}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to menu
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Ordered items
              </p>
              <h2 className="text-3xl">Kitchen ticket</h2>
            </div>
            <Badge variant="outline">
              {menuQuery.data
                ? sourceTypeMeta[menuQuery.data.source.sourceType] || titleCase(menuQuery.data.source.sourceType)
                : "QR"}
            </Badge>
          </div>

          <div className="space-y-4">
            {lastOrder.items.map((item, index) => (
              <article
                key={`${item.itemNameSnapshot}-${index}`}
                className="rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,242,232,0.9))] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl">{item.itemNameSnapshot}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Quantity {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.lineTotal, currency)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[28px] border border-border/70 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function formatGuestDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
