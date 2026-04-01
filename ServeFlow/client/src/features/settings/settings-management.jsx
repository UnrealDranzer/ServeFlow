import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2, Store } from "lucide-react";
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
import { getApiErrorMessage } from "@/lib/api-error";
import { getSettingsRequest, updateSettingsRequest } from "@/features/settings/settings-api";

const businessTypeOptions = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "tea_shop", label: "Tea Shop" },
  { value: "bakery", label: "Bakery" },
  { value: "fast_food", label: "Fast Food" },
  { value: "other", label: "Other" }
];

const orderModeOptions = [
  { value: "both", label: "QR + Manual" },
  { value: "qr", label: "QR Only" },
  { value: "manual", label: "Manual Only" }
];

const timezones = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC"
];

const initialForm = {
  name: "",
  businessType: "restaurant",
  ownerName: "",
  email: "",
  phone: "",
  logoUrl: "",
  currency: "INR",
  orderMode: "both",
  acceptingOrders: true,
  showImages: true,
  showItemDescription: true,
  showVegBadge: true,
  timezone: "Asia/Kolkata"
};

export function SettingsManagement() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettingsRequest
  });

  const saveMutation = useMutation({
    mutationFn: updateSettingsRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to update settings."));
    }
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    setFormState({
      name: settingsQuery.data.business.name,
      businessType: settingsQuery.data.business.businessType,
      ownerName: settingsQuery.data.business.ownerName,
      email: settingsQuery.data.business.email,
      phone: settingsQuery.data.business.phone,
      logoUrl: settingsQuery.data.business.logoUrl || "",
      currency: settingsQuery.data.business.currency,
      orderMode: settingsQuery.data.business.orderMode,
      acceptingOrders: settingsQuery.data.settings.acceptingOrders,
      showImages: settingsQuery.data.settings.showImages,
      showItemDescription: settingsQuery.data.settings.showItemDescription,
      showVegBadge: settingsQuery.data.settings.showVegBadge,
      timezone: settingsQuery.data.settings.timezone
    });
  }, [settingsQuery.data]);

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    saveMutation.mutate({
      ...formState,
      logoUrl: formState.logoUrl.trim() || null,
      currency: formState.currency.trim().toUpperCase()
    });
  }

  return (
    <PageShell
      title="Business Settings"
      description="Fine-tune the brand, ordering mode, and menu presentation rules that shape the ServeFlow experience."
    >
      {settingsQuery.isError ? (
        <EmptyState
          title="Settings could not be loaded"
          description={getApiErrorMessage(
            settingsQuery.error,
            "The business settings are currently unavailable."
          )}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="bg-white/92">
          <CardHeader>
            <CardTitle>Business Identity</CardTitle>
            <CardDescription>
              Control how the business appears to staff and customers across the QR and admin
              experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business name" htmlFor="businessName">
                  <Input
                    id="businessName"
                    value={formState.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Business type" htmlFor="businessType">
                  <Select
                    id="businessType"
                    value={formState.businessType}
                    onChange={(event) => updateForm("businessType", event.target.value)}
                  >
                    {businessTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Owner name" htmlFor="ownerName">
                  <Input
                    id="ownerName"
                    value={formState.ownerName}
                    onChange={(event) => updateForm("ownerName", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Email" htmlFor="businessEmail">
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formState.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Phone" htmlFor="businessPhone">
                  <Input
                    id="businessPhone"
                    value={formState.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Logo URL" htmlFor="logoUrl">
                  <Input
                    id="logoUrl"
                    placeholder="https://cdn.example.com/logo.png"
                    value={formState.logoUrl}
                    onChange={(event) => updateForm("logoUrl", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Currency" htmlFor="currencyCode">
                  <Input
                    id="currencyCode"
                    maxLength={3}
                    value={formState.currency}
                    onChange={(event) => updateForm("currency", event.target.value.toUpperCase())}
                  />
                </Field>
                <Field label="Order mode" htmlFor="orderMode">
                  <Select
                    id="orderMode"
                    value={formState.orderMode}
                    onChange={(event) => updateForm("orderMode", event.target.value)}
                  >
                    {orderModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Timezone" htmlFor="timezone">
                  <Select
                    id="timezone"
                    value={formState.timezone}
                    onChange={(event) => updateForm("timezone", event.target.value)}
                  >
                    {timezones.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="space-y-3 rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,240,228,0.72))] p-4">
                <SettingToggle
                  title="Accepting orders"
                  description="Pause public and operational order intake without deactivating the business."
                  checked={formState.acceptingOrders}
                  onCheckedChange={(checked) => updateForm("acceptingOrders", checked)}
                />
                <SettingToggle
                  title="Show item images"
                  description="Display menu imagery in the public QR menu."
                  checked={formState.showImages}
                  onCheckedChange={(checked) => updateForm("showImages", checked)}
                />
                <SettingToggle
                  title="Show item descriptions"
                  description="Keep the public menu rich and editorial when enabled."
                  checked={formState.showItemDescription}
                  onCheckedChange={(checked) => updateForm("showItemDescription", checked)}
                />
                <SettingToggle
                  title="Show veg badge"
                  description="Highlight vegetarian items clearly in the public experience."
                  checked={formState.showVegBadge}
                  onCheckedChange={(checked) => updateForm("showVegBadge", checked)}
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saveMutation.isPending || settingsQuery.isLoading}>
                  {saveMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,228,0.95))]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Brand Surface</CardTitle>
                  <CardDescription>How the business appears in ServeFlow today.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[28px] bg-secondary p-5 text-secondary-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-foreground/70">
                  Active Identity
                </p>
                <p className="mt-4 font-display text-4xl">{formState.name || "Business Name"}</p>
                <p className="mt-2 text-sm text-secondary-foreground/70">{formState.email}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniInfoCard label="Type" value={readLabel(businessTypeOptions, formState.businessType)} />
                <MiniInfoCard label="Mode" value={readLabel(orderModeOptions, formState.orderMode)} />
                <MiniInfoCard label="Currency" value={formState.currency || "INR"} />
                <MiniInfoCard label="Timezone" value={formState.timezone} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/92">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Public Menu Mood</CardTitle>
                  <CardDescription>
                    A premium QR menu depends on restraint as much as richness.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Images, descriptions, and veg badges should support clarity, not clutter. The best
                luxury hospitality interfaces feel calm, not crowded.
              </p>
              <p>
                These controls feed directly into the public menu response, so staff and customer
                experiences stay in sync without frontend-only toggles.
              </p>
            </CardContent>
          </Card>
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

function SettingToggle({ title, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/70 bg-white/70 px-4 py-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function MiniInfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-semibold">{value}</p>
    </div>
  );
}

function readLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}
