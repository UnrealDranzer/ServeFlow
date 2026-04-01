import { useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock3,
  Leaf,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency, titleCase } from "@/lib/format";
import { sourceTypeMeta } from "@/lib/status";
import { getPublicMenuRequest } from "@/features/public-menu/public-menu-api";
import { buildPublicScopeKey, usePublicCart } from "@/features/public-menu/public-cart";

export function PublicMenuExperience() {
  const { businessSlug, sourceSlug } = useParams();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const scopeKey = buildPublicScopeKey(businessSlug, sourceSlug);
  const cart = usePublicCart(scopeKey);

  const menuQuery = useQuery({
    queryKey: ["public-menu", businessSlug, sourceSlug],
    queryFn: () => getPublicMenuRequest(businessSlug, sourceSlug),
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

  if (menuQuery.isLoading) {
    return <PublicMenuSkeleton />;
  }

  if (menuQuery.isError) {
    return (
      <EmptyState
        title="Menu unavailable"
        description={getApiErrorMessage(
          menuQuery.error,
          "We could not load this QR menu right now. Please ask the staff for assistance."
        )}
      />
    );
  }

  const menu = menuQuery.data;
  const currency = menu.business.currency || "INR";
  const isAcceptingOrders = menu.settings.acceptingOrders;
  const searchValue = deferredSearch.trim().toLowerCase();
  const filteredCategories = menu.categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        if (!searchValue) {
          return true;
        }

        return `${item.name} ${item.description || ""}`.toLowerCase().includes(searchValue);
      })
    }))
    .filter((category) => category.items.length > 0);

  const totalItemCount = menu.categories.reduce((sum, category) => sum + category.items.length, 0);
  const hasMenuItems = menu.categories.length > 0;
  const displayedCategories = searchValue ? filteredCategories : menu.categories;
  const hasSearchResults = filteredCategories.length > 0;

  return (
    <div className="space-y-6 pb-28">
      <section className="relative overflow-hidden rounded-[36px] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(247,240,228,0.92)_58%,rgba(61,46,26,0.96)_100%)] p-6 shadow-glow sm:p-8">
        <div className="pointer-events-none absolute -right-10 top-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-40 rounded-full bg-accent/60 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white">QR Dining</Badge>
              <Badge className="bg-white/10 text-white">
                {sourceTypeMeta[menu.source.sourceType] || titleCase(menu.source.sourceType)}
              </Badge>
              <Badge className={isAcceptingOrders ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}>
                {isAcceptingOrders ? "Accepting orders" : "Orders paused"}
              </Badge>
            </div>

            <div className="space-y-3 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">
                ServeFlow Guest Experience
              </p>
              <h1 className="max-w-xl text-4xl text-white sm:text-5xl">
                {menu.business.name}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                Explore the live menu prepared for {menu.source.name}. Each order stays securely
                scoped to this business and source.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat
                icon={Store}
                label="Business"
                value={titleCase(menu.business.businessType)}
              />
              <HeroStat icon={UtensilsCrossed} label="Source" value={menu.source.name} />
              <HeroStat icon={Sparkles} label="Menu Items" value={`${totalItemCount}`} />
            </div>
          </div>

          <div className="w-full max-w-md rounded-[32px] border border-white/15 bg-white/10 p-5 text-white backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
              Curated for this order point
            </p>
            <p className="mt-3 font-display text-3xl">{menu.source.name}</p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              Browse at your pace, review your cart carefully, and send the order directly to the
              service team.
            </p>
            <div className="mt-5 rounded-[28px] border border-white/15 bg-black/10 px-4 py-4 text-sm text-white/78">
              {isAcceptingOrders
                ? "Orders are currently open for this source."
                : "This business has temporarily paused online ordering for this source."}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-border/80 bg-white/90 p-4 shadow-sm">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-14 border-none bg-transparent pl-11 shadow-none"
                placeholder="Search signature dishes, drinks, desserts..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {displayedCategories.length ? (
            <div className="flex flex-wrap gap-2">
              {displayedCategories.map((category) => (
                <a
                  key={category.id}
                  className="rounded-full border border-border/80 bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  href={`#category-${category.id}`}
                >
                  {category.name}
                </a>
              ))}
            </div>
          ) : null}

          {hasMenuItems ? (
            hasSearchResults ? (
              filteredCategories.map((category) => (
                <section id={`category-${category.id}`} key={category.id} className="space-y-4 scroll-mt-28">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Category
                      </p>
                      <h2 className="text-3xl">{category.name}</h2>
                    </div>
                    <Badge variant="outline">{category.items.length} items</Badge>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {category.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        currency={currency}
                        item={item}
                        orderDisabled={!isAcceptingOrders}
                        onAdd={() => cart.addItem(item)}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <EmptyState
                title="No menu items match this search"
                description="Try another dish name or clear the search to browse the full menu."
              />
            )
          ) : (
            <EmptyState
              title="Menu coming soon"
              description="This business has not published any orderable items for this source yet."
            />
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Service note
                </p>
                <p className="font-semibold text-foreground">
                  Prepared for {menu.source.name}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Item pricing and availability stay synced with the live business menu. Your final
              order is validated again on the server before it is accepted.
            </p>
          </div>

          <div className="rounded-[32px] border border-border/80 bg-secondary p-6 text-secondary-foreground shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-foreground/70">
              Cart status
            </p>
            <p className="mt-3 font-display text-4xl">{cart.itemCount}</p>
            <p className="mt-2 text-sm text-secondary-foreground/75">
              item{cart.itemCount === 1 ? "" : "s"} selected
            </p>
            <p className="mt-5 text-2xl font-semibold">
              {formatCurrency(cart.total, currency)}
            </p>
            {cart.itemCount ? (
              <Button asChild className="mt-6 w-full">
                <Link to="cart">
                  Review cart
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button className="mt-6 w-full" disabled>
                Review cart
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </aside>
      </section>

      {cart.itemCount ? (
        <div className="sticky bottom-4 z-20 mx-auto max-w-3xl">
          <Link
            className="flex items-center justify-between rounded-full border border-border/80 bg-[linear-gradient(90deg,rgba(52,38,24,0.96),rgba(103,78,43,0.96))] px-5 py-4 text-white shadow-glow backdrop-blur transition-transform hover:-translate-y-0.5"
            to="cart"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} in your cart
                </p>
                <p className="text-xs text-white/70">
                  Review notes and place the order securely
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatCurrency(cart.total, currency)}</p>
              <p className="text-xs text-white/70">Open cart</p>
            </div>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[28px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-2 text-white/72">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MenuItemCard({ item, currency, orderDisabled, onAdd }) {
  return (
    <article className="group overflow-hidden rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,242,232,0.9))] shadow-sm transition-transform hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(212,184,138,0.56),rgba(255,255,255,0.95)_58%,rgba(246,237,222,0.9)_100%)]">
        {item.imageUrl ? (
          <img
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={item.imageUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/75 text-primary shadow-sm">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {item.isVeg ? (
            <Badge className="bg-emerald-100 text-emerald-900">
              <Leaf className="mr-1 h-3 w-3" />
              Veg
            </Badge>
          ) : null}
          <Badge variant="outline" className="border-white/60 bg-white/75">
            Live menu
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-2xl">{item.name}</h3>
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
              {item.description || "Carefully prepared and ready for service from this live menu."}
            </p>
          </div>
          <p className="whitespace-nowrap text-lg font-semibold text-foreground">
            {formatCurrency(item.price, currency)}
          </p>
        </div>

        <Button className="w-full" disabled={orderDisabled} onClick={onAdd}>
          {orderDisabled ? "Ordering paused" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}

function PublicMenuSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[36px] border border-border/80 bg-white/80 p-6 shadow-glow sm:p-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-[28px]" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[32px] border border-border/80 bg-white/90">
            <Skeleton className="h-48 rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
