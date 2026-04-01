import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightCircle, RefreshCcw } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";
import { sourceTypeMeta } from "@/lib/status";
import { useAuth } from "@/features/auth/use-auth";
import { getOrderSourcesRequest } from "@/features/sources/sources-api";
import {
  getOrderDetailsRequest,
  getOrdersRequest,
  updateOrderStatusRequest
} from "@/features/orders/orders-api";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" }
];

const orderTypeOptions = [
  { value: "", label: "All order types" },
  { value: "manual", label: "Manual" },
  { value: "qr", label: "QR" }
];

const nextStatusesMap = {
  new: ["accepted", "preparing", "ready", "served", "paid", "cancelled"],
  accepted: ["preparing", "ready", "served", "paid", "cancelled"],
  preparing: ["ready", "served", "paid", "cancelled"],
  ready: ["served", "paid", "cancelled"],
  served: ["paid"],
  paid: [],
  cancelled: []
};

export function OrdersManagement() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const sourcesQuery = useQuery({
    queryKey: ["order-sources"],
    queryFn: getOrderSourcesRequest
  });

  const ordersQuery = useQuery({
    queryKey: [
      "orders",
      {
        statusFilter,
        orderTypeFilter,
        sourceFilter
      }
    ],
    queryFn: () =>
      getOrdersRequest({
        page: 1,
        pageSize: 30,
        status: statusFilter || undefined,
        orderType: orderTypeFilter || undefined,
        sourceId: sourceFilter || undefined
      }),
    refetchInterval: 10_000
  });

  useEffect(() => {
    if (!selectedOrderId && ordersQuery.data?.items?.length) {
      setSelectedOrderId(ordersQuery.data.items[0].id);
    }
  }, [selectedOrderId, ordersQuery.data]);

  const orderDetailQuery = useQuery({
    queryKey: ["orders", "detail", selectedOrderId],
    queryFn: () => getOrderDetailsRequest(selectedOrderId),
    enabled: Boolean(selectedOrderId),
    refetchInterval: 10_000
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatusRequest(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const currency = auth.business?.currency || "INR";
  const timezone = "Asia/Kolkata";
  const availableNextStatuses = nextStatusesMap[orderDetailQuery.data?.status] || [];

  return (
    <PageShell
      title="Live Orders"
      description="See the active service stream, inspect details, and progress orders cleanly through the shift."
      actions={
        <Button variant="outline" onClick={() => ordersQuery.refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,240,228,0.94))]">
            <CardHeader>
              <CardTitle>Order Filters</CardTitle>
              <CardDescription>
                Focus the queue by status, intake mode, or source without leaving the live board.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <FilterField label="Status">
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Order type">
                <Select
                  value={orderTypeFilter}
                  onChange={(event) => setOrderTypeFilter(event.target.value)}
                >
                  {orderTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Source">
                <Select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                  <option value="">All sources</option>
                  {sourcesQuery.data?.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </Select>
              </FilterField>
            </CardContent>
          </Card>

          <Card className="bg-white/92">
            <CardHeader>
              <CardTitle>Queue</CardTitle>
              <CardDescription>
                {ordersQuery.data?.pagination?.totalCount || 0} orders matched in the current view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersQuery.isLoading ? (
                <LoadingRows />
              ) : ordersQuery.isError ? (
                <EmptyState
                  title="Orders could not be loaded"
                  description={getApiErrorMessage(
                    ordersQuery.error,
                    "The live queue is currently unavailable."
                  )}
                />
              ) : ordersQuery.data?.items?.length ? (
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
                      {ordersQuery.data.items.map((order) => (
                        <TableRow
                          key={order.id}
                          className={selectedOrderId === order.id ? "bg-accent/40" : ""}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">{titleCase(order.orderType)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{order.source.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {sourceTypeMeta[order.source.sourceType]}
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
                            {formatDateTime(order.placedAt, timezone)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  title="No orders match this filter"
                  description="Try broadening the filters or create a new manual order to start the queue."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))]">
          <CardHeader>
            <CardTitle>Order Detail</CardTitle>
            <CardDescription>
              Review source, notes, line items, and secure status progression for the selected order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {orderDetailQuery.isLoading ? (
              <LoadingRows />
            ) : orderDetailQuery.isError ? (
              <EmptyState
                title="Order details unavailable"
                description={getApiErrorMessage(
                  orderDetailQuery.error,
                  "We could not load the selected order."
                )}
              />
            ) : orderDetailQuery.data ? (
              <>
                <div className="rounded-[28px] bg-secondary p-5 text-secondary-foreground">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-foreground/70">
                    Order Snapshot
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="font-display text-4xl">#{orderDetailQuery.data.id.slice(0, 8)}</p>
                    <StatusBadge status={orderDetailQuery.data.status} />
                  </div>
                  <p className="mt-3 text-sm text-secondary-foreground/75">
                    {orderDetailQuery.data.source.name} - {titleCase(orderDetailQuery.data.orderType)} -{" "}
                    {formatDateTime(orderDetailQuery.data.placedAt, timezone)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    label="Total"
                    value={formatCurrency(orderDetailQuery.data.total, currency)}
                  />
                  <InfoCard
                    label="Placed By"
                    value={orderDetailQuery.data.placedBy?.name || "QR Customer"}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Line Items
                  </p>
                  <div className="space-y-3">
                    {orderDetailQuery.data.items.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-border/70 bg-white/80 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{item.itemNameSnapshot}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Qty {item.quantity}
                              {item.itemNote ? ` - ${item.itemNote}` : ""}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(item.lineTotal, currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {orderDetailQuery.data.customerNote ? (
                  <div className="rounded-3xl border border-border/70 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Customer Note
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {orderDetailQuery.data.customerNote}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Next Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableNextStatuses.length ? (
                      availableNextStatuses.map((status) => (
                        <Button
                          key={status}
                          type="button"
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              orderId: orderDetailQuery.data.id,
                              status
                            })
                          }
                        >
                          <ArrowRightCircle className="mr-2 h-4 w-4" />
                          {titleCase(status)}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No further transitions are available for this order.
                      </p>
                    )}
                  </div>
                  {statusMutation.isError ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {getApiErrorMessage(statusMutation.error, "Unable to update order status.")}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                title="Select an order"
                description="Choose an order from the queue to inspect details and progress its status."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
