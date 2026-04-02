import { useQuery } from "@tanstack/react-query";
import { Banknote, CircleDollarSign, ListTodo, WalletCards } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/use-auth";
import { getDashboardSummaryRequest, getRecentOrdersRequest } from "@/features/dashboard/dashboard-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency, formatShortDateTime, titleCase } from "@/lib/format";

export function DashboardOverview() {
  const auth = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummaryRequest,
    refetchInterval: 30_000
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: () => getRecentOrdersRequest(8),
    refetchInterval: 15_000
  });

  const currency = auth.business?.currency || "INR";

  return (
    <PageShell
      title="Today's Overview"
      description="Quick look at today's sales and recent orders."
    >
      {summaryQuery.isError ? (
        <EmptyState
          title="Could not load data"
          description={getApiErrorMessage(summaryQuery.error, "Something went wrong loading your store data.")}
        />
      ) : null}

      <section className="grid gap-4 sm:gap-6 grid-cols-2 xl:grid-cols-4">
        {summaryQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-4 sm:mt-6 h-8 sm:h-10 w-28 sm:w-40" />
                <Skeleton className="mt-3 sm:mt-4 h-4 w-24 sm:w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              label="Today's Sales"
              value={formatCurrency(summaryQuery.data?.todaySales, currency)}
              note="Total from paid orders"
              icon={CircleDollarSign}
            />
            <MetricCard
              label="Total Orders"
              value={summaryQuery.data?.todayOrders ?? 0}
              note="All orders received today"
              icon={WalletCards}
            />
            <MetricCard
              label="Active Now"
              value={summaryQuery.data?.pendingOrders ?? 0}
              note="Being prepared or served"
              icon={ListTodo}
            />
            <MetricCard
              label="Avg. Bill"
              value={formatCurrency(summaryQuery.data?.averageOrderValue, currency)}
              note="Average per order"
              icon={Banknote}
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
                    <div key={order.id} className="rounded-xl border border-border/50 bg-white p-3 shadow-sm">
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
                    </div>
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
                        <TableRow key={order.id} className="cursor-pointer transition-colors hover:bg-muted/30">
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
                            {formatShortDateTime(order.placedAt, summaryQuery.data?.timezone)}
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
