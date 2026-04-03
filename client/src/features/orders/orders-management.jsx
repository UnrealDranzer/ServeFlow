import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightCircle, Pencil, Printer, RefreshCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/use-auth";
import { getOrderSourcesRequest } from "@/features/sources/sources-api";
import {
  getOrderDetailsRequest,
  getOrdersRequest,
  updateOrderStatusRequest
} from "@/features/orders/orders-api";
import { EditOrderDialog } from "@/features/orders/edit-order-dialog";
import { printBill } from "@/features/orders/print-bill";

const statusOptions = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" }
];

const orderTypeOptions = [
  { value: "", label: "All types" },
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

const editableStatuses = ["new", "accepted", "preparing"];

export function OrdersManagement() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const detailsRef = useRef(null);
  const searchParamsSnapshot = searchParams.toString();
  const routeOrderId = searchParams.get("orderId") || "";

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
    if (routeOrderId && routeOrderId !== selectedOrderId) {
      setSelectedOrderId(routeOrderId);
      return;
    }

    const firstOrderId = ordersQuery.data?.items?.[0]?.id;

    if (!routeOrderId && !selectedOrderId && firstOrderId) {
      setSelectedOrderId(firstOrderId);

      const nextSearchParams = new URLSearchParams(searchParamsSnapshot);
      nextSearchParams.set("orderId", firstOrderId);

      if (nextSearchParams.toString() !== searchParamsSnapshot) {
        setSearchParams(nextSearchParams, { replace: true });
      }
    }
  }, [ordersQuery.data?.items, routeOrderId, searchParamsSnapshot, selectedOrderId, setSearchParams]);

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
  const businessName = auth.business?.name || "Restaurant";
  const timezone = "Asia/Kolkata";
  const availableNextStatuses = nextStatusesMap[orderDetailQuery.data?.status] || [];
  const canEdit = editableStatuses.includes(orderDetailQuery.data?.status);

  function handleSelectOrder(orderId, { scrollToDetails = true } = {}) {
    if (orderId !== selectedOrderId) {
      setSelectedOrderId(orderId);

      const nextSearchParams = new URLSearchParams(searchParamsSnapshot);
      nextSearchParams.set("orderId", orderId);

      if (nextSearchParams.toString() !== searchParamsSnapshot) {
        setSearchParams(nextSearchParams, { replace: true });
      }
    }

    if (scrollToDetails && typeof window !== "undefined" && window.innerWidth < 640) {
      window.requestAnimationFrame(() => {
        detailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  }

  function handlePrintBill() {
    if (!orderDetailQuery.data) {
      return;
    }

    printBill({
      order: orderDetailQuery.data,
      businessName,
      currency,
      timezone
    });
  }

  return (
    <PageShell
      title="Orders"
      description="View and manage all current orders."
      actions={
        <Button variant="ghost" size="sm" onClick={() => ordersQuery.refetch()} className="font-bold">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {/* Filters */}
      <Card className="border-none bg-muted/20 shadow-sm">
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-6">
          <FilterField label="Status">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Type">
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
          <FilterField label="Table">
            <Select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="">All</option>
              {sourcesQuery.data?.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </Select>
          </FilterField>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Order List */}
        <Card className="border-none bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-bold">Order Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersQuery.isLoading ? (
              <div className="p-4 sm:p-6"><LoadingRows /></div>
            ) : ordersQuery.isError ? (
              <div className="p-4 sm:p-6">
                <EmptyState
                  title="Could not load orders"
                  description={getApiErrorMessage(
                    ordersQuery.error,
                    "Something went wrong loading orders."
                  )}
                />
              </div>
            ) : ordersQuery.data?.items?.length ? (
              <>
                {/* Mobile card list */}
                <div className="space-y-2 p-3 sm:hidden">
                  {ordersQuery.data.items.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
                        selectedOrderId === order.id
                          ? "border-primary/30 bg-primary/8 shadow-sm"
                          : "border-border/50 bg-white hover:bg-muted/20"
                      )}
                      onClick={() => handleSelectOrder(order.id)}
                    >
                      <div>
                        <p className="text-sm font-bold">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{order.source.name} · {order.orderType.toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(order.total, currency)}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </button>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="font-bold text-[10px] uppercase pl-6">ID</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase">Table</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase">Status</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase pr-6 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersQuery.data.items.map((order) => (
                        <TableRow
                          key={order.id}
                          className={cn(
                            "cursor-pointer transition-colors border-b last:border-0",
                            selectedOrderId === order.id ? "bg-primary/8" : "hover:bg-muted/30"
                          )}
                          onClick={() => handleSelectOrder(order.id, { scrollToDetails: false })}
                        >
                          <TableCell className="pl-6 py-4">
                            <p className="font-bold text-foreground">#{order.id.slice(0, 8)}</p>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase">{order.orderType}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-sm">{order.source.name}</p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="pr-6 text-right font-bold text-sm">
                            {formatCurrency(order.total, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="p-4 sm:p-6">
                <EmptyState
                  title="No orders found"
                  description="Try changing the filters or wait for new orders to come in."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <div ref={detailsRef}>
        <Card className="border-none bg-muted/10 shadow-sm lg:border-l lg:border-border/50">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg font-bold">Order Details</CardTitle>
              {orderDetailQuery.data ? (
                <div className="hidden gap-2 sm:flex">
                  {canEdit ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="font-bold text-xs"
                      onClick={() => setIsEditOpen(true)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit Order
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="font-bold text-xs"
                    onClick={handlePrintBill}
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    Print Bill
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {orderDetailQuery.isLoading ? (
              <LoadingRows />
            ) : orderDetailQuery.isError ? (
              <EmptyState
                title="Could not load details"
                description={getApiErrorMessage(
                  orderDetailQuery.error,
                  "Something went wrong loading this order."
                )}
              />
            ) : orderDetailQuery.data ? (
              <>
                <div className="rounded-xl border border-border/50 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-3 sm:pb-4 mb-3 sm:mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/65">
                        Order
                      </p>
                      <p className="font-display text-xl sm:text-2xl font-bold">#{orderDetailQuery.data.id.slice(0, 8)}</p>
                    </div>
                    <StatusBadge status={orderDetailQuery.data.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/65">Table</p>
                      <p className="font-bold text-sm">{orderDetailQuery.data.source.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/65">Time</p>
                      <p className="font-bold text-sm">{formatDateTime(orderDetailQuery.data.placedAt, timezone)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    Items
                  </p>
                  <div className="space-y-2">
                    {orderDetailQuery.data.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center rounded-lg bg-white/60 p-3 text-sm">
                        <div className="flex gap-2 sm:gap-3 items-center">
                          <span className="font-bold bg-muted px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                          <span className="font-medium text-foreground">{item.itemNameSnapshot}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(item.lineTotal, currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center border-t pt-3 mt-2 px-3">
                      <span className="font-bold text-muted-foreground">TOTAL</span>
                      <span className="font-display text-lg sm:text-xl font-bold text-foreground">
                        {formatCurrency(orderDetailQuery.data.total, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {orderDetailQuery.data.customerNote ? (
                  <div className="rounded-lg bg-orange-50 p-3 sm:p-4 border border-orange-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-800">
                      Customer Note
                    </p>
                    <p className="mt-1 text-sm font-medium text-orange-900">
                      {orderDetailQuery.data.customerNote}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    Change Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableNextStatuses.length ? (
                      availableNextStatuses.map((status) => (
                        <Button
                          key={status}
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={statusMutation.isPending}
                          className="font-bold uppercase text-[10px] tracking-wider py-1"
                          onClick={() =>
                            statusMutation.mutate({
                              orderId: orderDetailQuery.data.id,
                              status
                            })
                          }
                        >
                          <ArrowRightCircle className="mr-1.5 h-3.5 w-3.5" />
                          {titleCase(status)}
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs font-medium text-muted-foreground italic">
                        This order is complete.
                      </p>
                    )}
                  </div>
                  {statusMutation.isError ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive font-medium">
                      {getApiErrorMessage(statusMutation.error, "Could not update status. Please try again.")}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                title="Tap an order"
                description="Select an order from the list to see its details."
              />
            )}
          </CardContent>
        </Card>
        </div>
      </section>

      {isEditOpen && orderDetailQuery.data ? (
        <EditOrderDialog
          order={orderDetailQuery.data}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
          }}
        />
      ) : null}

      {orderDetailQuery.data ? (
        <div
          className="fixed inset-x-4 z-30 rounded-[24px] border border-border/80 bg-white/96 p-3 shadow-[0_18px_38px_rgba(17,24,39,0.14)] backdrop-blur sm:hidden"
          style={{ bottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/65">
                Selected order
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                #{orderDetailQuery.data.id.slice(0, 8)} - {orderDetailQuery.data.source.name}
              </p>
            </div>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(orderDetailQuery.data.total, currency)}
            </p>
          </div>
          <div className={cn("mt-3 grid gap-2", canEdit ? "grid-cols-2" : "grid-cols-1")}>
            {canEdit ? (
              <Button size="sm" variant="secondary" onClick={() => setIsEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Items
              </Button>
            ) : null}
            <Button size="sm" onClick={handlePrintBill}>
              <Printer className="mr-2 h-4 w-4" />
              Print Bill
            </Button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-1 sm:space-y-2">
      <p className="text-xs sm:text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-14 sm:h-16 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
