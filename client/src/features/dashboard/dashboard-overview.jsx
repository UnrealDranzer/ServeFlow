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
      title="Store Overview"
      description="Quick summary of today's sales, orders, and active tickets."
    >
      {summaryQuery.isError ? (
        <EmptyState
          title="Overview data is unavailable"
          description={getApiErrorMessage(summaryQuery.error, "We could not load store metrics.")}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
        {summaryQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-none shadow-sm">
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
              label="Sales Today"
              value={formatCurrency(summaryQuery.data?.todaySales, currency)}
              note="Total revenue from paid orders."
              icon={CircleDollarSign}
            />
            <MetricCard
              label="Total Orders"
              value={summaryQuery.data?.todayOrders ?? 0}
              note="Count of all orders received today."
              icon={WalletCards}
            />
            <MetricCard
              label="Active Orders"
              value={summaryQuery.data?.pendingOrders ?? 0}
              note="Orders currently in the kitchen or being served."
              icon={ListTodo}
            />
            <MetricCard
              label="Avg. Bill"
              value={formatCurrency(summaryQuery.data?.averageOrderValue, currency)}
              note="Average amount spent per order today."
              icon={Banknote}
            />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-none bg-white shadow-sm">
          <CardHeader className="pb-3 text-left">
            <CardTitle className="text-xl font-bold">Latest Orders</CardTitle>
            <CardDescription>
              Most recent orders from all tables and sources.
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
                title="Latest orders could not be loaded"
                description={getApiErrorMessage(
                  recentOrdersQuery.error,
                  "The latest orders are currently unavailable."
                )}
              />
            ) : recentOrdersQuery.data?.length ? (
              <div className="overflow-x-auto">
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
            ) : (
              <EmptyState
                title="No orders yet"
                description="Once you start taking orders, they will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-muted/30 shadow-sm">
          <CardHeader className="text-left">
            <CardTitle className="text-xl font-bold">Helpful Tips</CardTitle>
            <CardDescription>
              Quick guide for staff.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <div className="rounded-xl bg-white p-4 shadow-sm text-foreground font-medium">
              Check the "Active Orders" count to keep track of kitchen volume.
            </div>
            <p>
              Sales reflect all completed payments. To see more details, click on an order in the list.
            </p>
            <p>
              Use the sidebar to create new orders or manage your menu items quickly.
            </p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
