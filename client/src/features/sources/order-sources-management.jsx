import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Copy, Download, Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-error";
import { sourceTypeMeta } from "@/lib/status";
import {
  createOrderSourceRequest,
  deleteOrderSourceRequest,
  getOrderSourceQrRequest,
  getOrderSourcesRequest,
  updateOrderSourceRequest
} from "@/features/sources/sources-api";

const sourceTypeOptions = [
  { value: "table", label: "Table" },
  { value: "counter", label: "Counter" },
  { value: "takeaway", label: "Takeaway" },
  { value: "parcel", label: "Parcel" }
];

const initialForm = {
  name: "",
  slug: "",
  sourceType: "table",
  isActive: true
};

export function OrderSourcesManagement() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingSource, setEditingSource] = useState(null);
  const [selectedPreviewId, setSelectedPreviewId] = useState("");
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [formState, setFormState] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const searchParamsSnapshot = searchParams.toString();
  const previewParam = searchParams.get("preview") || "";
  const modeParam = searchParams.get("mode") || "";

  const sourcesQuery = useQuery({
    queryKey: ["order-sources"],
    queryFn: getOrderSourcesRequest
  });

  function updateSearchParams(mutator) {
    const nextSearchParams = new URLSearchParams(searchParamsSnapshot);
    mutator(nextSearchParams);

    if (nextSearchParams.toString() !== searchParamsSnapshot) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }

  useEffect(() => {
    if (
      previewParam &&
      sourcesQuery.data?.length &&
      !sourcesQuery.data.some((source) => source.id === previewParam)
    ) {
      updateSearchParams((nextSearchParams) => {
        nextSearchParams.delete("preview");
      });
      return;
    }

    if (previewParam && previewParam !== selectedPreviewId) {
      setSelectedPreviewId(previewParam);
      return;
    }

    const firstSourceId = sourcesQuery.data?.[0]?.id;

    if (!previewParam && !selectedPreviewId && firstSourceId) {
      setSelectedPreviewId(firstSourceId);
      updateSearchParams((nextSearchParams) => {
        nextSearchParams.set("preview", firstSourceId);
      });
    }
  }, [previewParam, searchParamsSnapshot, selectedPreviewId, sourcesQuery.data]);

  const qrQuery = useQuery({
    queryKey: ["order-sources", "qr", selectedPreviewId],
    queryFn: () => getOrderSourceQrRequest(selectedPreviewId),
    enabled: Boolean(selectedPreviewId)
  });

  useEffect(() => {
    if (!qrQuery.data?.publicPath) {
      setQrPreviewUrl("");
      return;
    }

    let isActive = true;
    const dynamicUrl = `${window.location.origin}${qrQuery.data.publicPath}`;

    QRCode.toDataURL(dynamicUrl, {
      margin: 1,
      width: 260,
      color: {
        dark: "#302214",
        light: "#FFF9F0"
      }
    }).then((dataUrl) => {
      if (isActive) {
        setQrPreviewUrl(dataUrl);
      }
    });

    return () => {
      isActive = false;
    };
  }, [qrQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingSource) {
        return updateOrderSourceRequest(editingSource.id, payload);
      }

      return createOrderSourceRequest(payload);
    },
    onSuccess: (source) => {
      queryClient.invalidateQueries({ queryKey: ["order-sources"] });
      setEditingSource(null);
      setFormState(initialForm);
      setErrorMessage("");
      setSelectedPreviewId(source.id);
      updateSearchParams((nextSearchParams) => {
        nextSearchParams.delete("mode");
        nextSearchParams.set("preview", source.id);
      });
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to save order source."));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrderSourceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-sources"] });
      resetEditor();
      setSelectedPreviewId("");
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete order source."));
    }
  });

  function resetEditor() {
    setEditingSource(null);
    setFormState(initialForm);
    setErrorMessage("");
    updateSearchParams((nextSearchParams) => {
      nextSearchParams.delete("mode");
    });
  }

  function startEditing(source) {
    setEditingSource(source);
    setFormState({
      name: source.name,
      slug: source.slug,
      sourceType: source.sourceType,
      isActive: source.isActive
    });
    setSelectedPreviewId(source.id);
    setErrorMessage("");
    updateSearchParams((nextSearchParams) => {
      nextSearchParams.delete("mode");
      nextSearchParams.set("preview", source.id);
    });
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openCreateEditor() {
    updateSearchParams((nextSearchParams) => {
      nextSearchParams.set("mode", "create");
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    saveMutation.mutate({
      name: formState.name.trim(),
      slug: formState.slug.trim() || undefined,
      sourceType: formState.sourceType,
      isActive: formState.isActive
    });
  }

  function handleDelete(source) {
    const confirmed = window.confirm(
      `Delete "${source.name}"? This is blocked if orders already exist for the source.`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    deleteMutation.mutate(source.id);
  }

  function selectPreview(sourceId, { scrollToPreview = true } = {}) {
    if (sourceId !== selectedPreviewId) {
      setSelectedPreviewId(sourceId);
      updateSearchParams((nextSearchParams) => {
        nextSearchParams.set("preview", sourceId);
      });
    }

    if (scrollToPreview) {
      window.requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async function copyQrUrl() {
    if (!qrQuery.data?.publicPath) {
      return;
    }

    const dynamicUrl = `${window.location.origin}${qrQuery.data.publicPath}`;
    await navigator.clipboard.writeText(dynamicUrl);
  }

  function downloadQrCode() {
    if (!qrPreviewUrl || !qrQuery.data) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrPreviewUrl;
    link.download = `${qrQuery.data.slug}-qr.png`;
    link.click();
  }

  useEffect(() => {
    if (modeParam !== "create") {
      return;
    }

    setEditingSource(null);
    setFormState(initialForm);
    setErrorMessage("");
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [modeParam]);

  return (
    <PageShell
      title="Tables & QR Codes"
      description="Set up your tables, counter, takeaway, and parcel points. Each one gets its own QR code."
      actions={
        <Button onClick={openCreateEditor}>
          <Plus className="mr-2 h-4 w-4" />
          New Source
        </Button>
      }
    >
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_350px]">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle>Your Tables & Sources</CardTitle>
            <CardDescription>
              Each source gets a unique QR code that customers can scan to order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sourcesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : sourcesQuery.isError ? (
              <EmptyState
                title="Sources could not be loaded"
                description={getApiErrorMessage(
                  sourcesQuery.error,
                  "The order sources list is currently unavailable."
                )}
              />
            ) : sourcesQuery.data?.length ? (
              <>
                {/* Mobile view */}
                <div className="grid gap-3 sm:hidden">
                  {sourcesQuery.data.map((source) => (
                    <div key={source.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-bold text-foreground">{source.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sourceTypeMeta[source.sourceType]} · Slug: {source.slug}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            source.isActive
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {source.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 whitespace-nowrap px-2"
                          onClick={() => selectPreview(source.id)}
                        >
                          <QrCode className="mr-1.5 h-4 w-4" />
                          <span className="sr-only">QR</span> View QR
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 whitespace-nowrap px-2"
                          onClick={() => startEditing(source)}
                        >
                          <Pencil className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 whitespace-nowrap px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(source)}
                        >
                          <Trash2 className="mx-auto h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sourcesQuery.data.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold">{source.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {sourceTypeMeta[source.sourceType]}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{source.slug}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                source.isActive
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-stone-200 text-stone-700"
                              }`}
                            >
                              {source.isActive ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => selectPreview(source.id, { scrollToPreview: false })}
                              >
                                <QrCode className="mr-2 h-4 w-4" />
                                QR
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(source)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDelete(source)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <EmptyState
                title="No sources configured"
                description="Create your first table, counter, takeaway, or parcel source to begin receiving orders."
                actionLabel="Create source"
                onAction={openCreateEditor}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div ref={editorRef}>
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))]">
            <CardHeader>
              <CardTitle>{editingSource ? "Edit Source" : "Add New Source"}</CardTitle>
              <CardDescription>
                Give it a clear name like "Table 5" or "Takeaway". The QR code is created automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <Field label="Source name" htmlFor="sourceName">
                  <Input
                    id="sourceName"
                    placeholder="Table 12"
                    value={formState.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Slug" htmlFor="sourceSlug">
                  <Input
                    id="sourceSlug"
                    placeholder="table-12"
                    value={formState.slug}
                    onChange={(event) => updateForm("slug", event.target.value)}
                  />
                </Field>
                <Field label="Source type" htmlFor="sourceType">
                  <Select
                    id="sourceType"
                    value={formState.sourceType}
                    onChange={(event) => updateForm("sourceType", event.target.value)}
                  >
                    {sourceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex items-center justify-between rounded-3xl border border-border/80 bg-white/80 px-4 py-4">
                  <div>
                    <p className="font-semibold">Active</p>
                    <p className="text-sm text-muted-foreground">
                      Turn off to stop taking orders from this source.
                    </p>
                  </div>
                  <Switch
                    checked={formState.isActive}
                    onCheckedChange={(checked) => updateForm("isActive", checked)}
                  />
                </div>
                {errorMessage ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending
                      ? "Saving..."
                      : editingSource
                        ? "Update Source"
                        : "Create Source"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetEditor}>
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>

          <div ref={previewRef}>
          <Card className="bg-white/92">
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>
                Print this QR code and place it on the table. Customers scan it to order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrQuery.isLoading ? (
                <div className="h-72 animate-pulse rounded-[32px] bg-muted" />
              ) : qrQuery.isError ? (
                <EmptyState
                  title="QR preview unavailable"
                  description={getApiErrorMessage(qrQuery.error, "The QR target could not be loaded.")}
                />
              ) : qrQuery.data ? (
                <>
                  <div className="flex items-center justify-between rounded-[32px] bg-[linear-gradient(180deg,#fff9f0,#f6e9d1)] p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Current Source
                      </p>
                      <p className="mt-3 font-display text-3xl">{qrQuery.data.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{qrQuery.data.publicPath}</p>
                    </div>
                    {qrPreviewUrl ? (
                      <div className="rounded-[32px] bg-white p-4 shadow-sm">
                        <img alt={`${qrQuery.data.name} QR`} className="h-40 w-40" src={qrPreviewUrl} />
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-3xl border border-border/80 bg-white/80 px-4 py-4 text-sm text-muted-foreground break-all">
                    {`${window.location.origin}${qrQuery.data.publicPath}`}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={copyQrUrl}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button type="button" onClick={downloadQrCode}>
                      <Download className="mr-2 h-4 w-4" />
                      Download QR
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No source selected"
                  description="Choose a source from the list to preview its QR destination."
                />
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </section>
    </PageShell>
  );

  function updateForm(field, value) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value
    }));
  }
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
