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
      title="Operations Dashboard"
      description="A premium command center for shift pace, revenue flow, and live restaurant demand."
    >
      {summaryQuery.isError ? (
        <EmptyState
          title="Dashboard data is unavailable"
          description={getApiErrorMessage(summaryQuery.error, "We could not load dashboard metrics.")}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {summaryQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-6 h-10 w-40" />
                <Skeleton className="mt-4 h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              label="Today Sales"
              value={formatCurrency(summaryQuery.data?.todaySales, currency)}
              note={`Revenue counted from paid orders in ${summaryQuery.data?.timezone}.`}
              icon={CircleDollarSign}
            />
            <MetricCard
              label="Today Orders"
              value={summaryQuery.data?.todayOrders ?? 0}
              note="All orders placed during the current business day."
              icon={WalletCards}
            />
            <MetricCard
              label="Pending Orders"
              value={summaryQuery.data?.pendingOrders ?? 0}
              note="New, accepted, preparing, and ready orders still in motion."
              icon={ListTodo}
            />
            <MetricCard
              label="Average Order"
              value={formatCurrency(summaryQuery.data?.averageOrderValue, currency)}
              note="Average order value for today, excluding cancelled orders."
              icon={Banknote}
            />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden bg-white/92">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Live order flow across dine-in, counter, takeaway, and parcel sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrdersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : recentOrdersQuery.isError ? (
              <EmptyState
                title="Recent orders could not be loaded"
                description={getApiErrorMessage(
                  recentOrdersQuery.error,
                  "The latest orders are currently unavailable."
                )}
              />
            ) : recentOrdersQuery.data?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Placed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrdersQuery.data.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.items
                                .slice(0, 2)
                                .map((item) => `${item.itemNameSnapshot} x${item.quantity}`)
                                .join(", ")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{order.source.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {titleCase(order.source.sourceType)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(order.total, currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatShortDateTime(order.placedAt, summaryQuery.data?.timezone)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="No orders yet"
                description="Once the business starts receiving orders, the live feed will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,240,228,0.94))]">
          <CardHeader>
            <CardTitle>Shift Notes</CardTitle>
            <CardDescription>
              A quick operational readout of what this dashboard represents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-3xl bg-accent/60 p-4 text-accent-foreground">
              ServeFlow keeps this dashboard tenant-scoped, so all metrics are derived from the
              authenticated business only.
            </div>
            <p>
              Revenue is calculated from paid orders, pending volume reflects the kitchen queue, and
              timestamps are presented using the business timezone rather than the browser default.
            </p>
            <p>
              In the next step we can layer live polling polish further, but the core dashboard is
              already connected to the production-safe backend contracts.
            </p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
