import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, ListTodo, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/use-auth";
import { getDashboardStatsRequest, getRecentOrdersRequest } from "@/features/dashboard/dashboard-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency, formatShortDateTime, titleCase } from "@/lib/format";

const dashboardRangeOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" }
];

export function DashboardOverview() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState("today");

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats", range],
    queryFn: () => getDashboardStatsRequest(range),
    refetchInterval: 30_000
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: () => getRecentOrdersRequest(8),
    refetchInterval: 15_000
  });

  const currency = auth.business?.currency || "INR";
  const activeRangeLabel =
    dashboardRangeOptions.find((option) => option.value === range)?.label || "Today";

  function openOrder(orderId) {
    navigate(`/app/orders?orderId=${orderId}`);
  }

  return (
    <PageShell
      title="Business Overview"
      description="Track paid sales, active orders, and recent activity from one place."
    >
      {statsQuery.isError ? (
        <EmptyState
          title="Could not load data"
          description={getApiErrorMessage(statsQuery.error, "Something went wrong loading your store data.")}
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {statsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-4 sm:mt-6 h-8 sm:h-10 w-28 sm:w-40" />
                <Skeleton className="mt-3 sm:mt-4 h-4 w-24 sm:w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-none bg-white shadow-sm">
              <CardContent className="space-y-5 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                        <CircleDollarSign className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground/80">Paid Sales</p>
                    </div>
                    <p className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      {formatCurrency(statsQuery.data?.sales, currency)}
                    </p>
                  </div>
                  <div className="w-full max-w-full rounded-[26px] border border-border/70 bg-[linear-gradient(180deg,rgba(248,247,244,0.96),rgba(255,255,255,0.98))] p-3 shadow-sm sm:w-[196px] sm:min-w-[196px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/58">
                      Sales range
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground/78">
                      {activeRangeLabel}
                    </p>
                    <Select
                      className="mt-3 h-11 w-full rounded-2xl border-border/70 bg-white text-sm font-semibold shadow-none"
                      value={range}
                      onChange={(event) => setRange(event.target.value)}
                    >
                      {dashboardRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Paid revenue for {activeRangeLabel.toLowerCase()}.
                </p>
              </CardContent>
            </Card>
            <MetricCard
              label="Paid Orders"
              value={statsQuery.data?.totalOrders ?? 0}
              note={`Completed orders in ${activeRangeLabel.toLowerCase()}`}
              icon={WalletCards}
            />
            <MetricCard
              label="Active Now"
              value={statsQuery.data?.pendingOrders ?? 0}
              note="Being prepared or served"
              icon={ListTodo}
            />
          </>
        )}
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-none bg-white shadow-sm">
          <CardHeader className="pb-3 text-left">
            <CardTitle className="text-lg sm:text-xl font-bold">Recent Orders</CardTitle>
            <CardDescription>
              Latest orders from all tables and sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrdersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 sm:h-16 w-full" />
                ))}
              </div>
            ) : recentOrdersQuery.isError ? (
              <EmptyState
                title="Could not load orders"
                description={getApiErrorMessage(
                  recentOrdersQuery.error,
                  "Recent orders are unavailable right now."
                )}
              />
            ) : recentOrdersQuery.data?.length ? (
              <>
                {/* Mobile card view */}
                <div className="space-y-3 sm:hidden">
                  {recentOrdersQuery.data.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className="w-full rounded-xl border border-border/50 bg-white p-3 text-left shadow-sm transition-colors hover:bg-muted/20"
                      onClick={() => openOrder(order.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{order.source.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(order.total, currency)}</p>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
                        {order.items
                          .slice(0, 2)
                          .map((item) => `${item.itemNameSnapshot} x${item.quantity}`)
                          .join(", ")}
                      </p>
                    </button>
                  ))}
                </div>
                {/* Desktop table view */}
                <div className="hidden overflow-x-auto sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Order</TableHead>
                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Source</TableHead>
                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Total</TableHead>
                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrdersQuery.data.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer transition-colors hover:bg-muted/30"
                          onClick={() => openOrder(order.id)}
                        >
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-bold text-foreground">#{order.id.slice(0, 8)}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {order.items
                                  .slice(0, 2)
                                  .map((item) => `${item.itemNameSnapshot} x${item.quantity}`)
                                  .join(", ")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm">{order.source.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {titleCase(order.source.sourceType)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                            {formatCurrency(order.total, currency)}
                          </TableCell>
                          <TableCell className="text-[11px] font-medium text-muted-foreground">
                            {formatShortDateTime(order.placedAt, statsQuery.data?.timezone)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <EmptyState
                title="No orders yet"
                description="Once you start taking orders, they'll show up here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-muted/30 shadow-sm">
          <CardHeader className="text-left">
            <CardTitle className="text-lg sm:text-xl font-bold">Quick Tips</CardTitle>
            <CardDescription>
              Helpful info for your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <div className="rounded-xl bg-white p-4 shadow-sm text-foreground font-medium">
              Watch the "Active Now" number to see how busy the kitchen is.
            </div>
            <p>
              Sales numbers update when orders are marked as paid. Check the orders page for full details.
            </p>
            <p>
              Use the bottom menu to quickly jump between orders, new orders, and your dishes.
            </p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
