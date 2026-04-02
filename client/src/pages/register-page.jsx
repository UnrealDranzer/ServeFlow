import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { registerRequest } from "@/features/auth/auth-api";
import { useAuth } from "@/features/auth/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";
import { registrationBusinessTypeOptions } from "@/lib/business-types";
import { normalizeBusinessSlug } from "@/lib/slug";

const initialForm = {
  businessName: "",
  businessSlug: "",
  ownerName: "",
  email: "",
  password: "",
  confirmPassword: "",
  businessType: "restaurant",
  phone: ""
};

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCustomSlug, setHasCustomSlug] = useState(false);

  if (!auth.isBootstrapped || auth.status === "loading") {
    return (
      <FullPageSpinner
        title="Loading..."
        description="Just a moment while we get things ready."
      />
    );
  }

  if (auth.isAuthenticated) {
    return <Navigate to={location.state?.from || "/app/dashboard"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextFieldErrors = validateRegisterForm(form);

    setFieldErrors(nextFieldErrors);
    setErrorMessage("");

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        businessName: form.businessName.trim(),
        businessSlug: normalizeBusinessSlug(form.businessSlug),
        ownerName: form.ownerName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        businessType: form.businessType,
        phone: form.phone.trim() || undefined
      };

      const response = await registerRequest(payload);
      const nextSearchParams = new URLSearchParams({
        registered: "1",
        businessSlug: response.business.slug,
        email: response.owner.email
      });

      navigate(`/login?${nextSearchParams.toString()}`, {
        replace: true
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to create this business workspace right now.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field, value) {
    setForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [field]: value
      };

      if (field === "businessName" && !hasCustomSlug) {
        nextForm.businessSlug = normalizeBusinessSlug(value);
      }

      if (field === "businessSlug") {
        setHasCustomSlug(value.trim().length > 0);
      }

      return nextForm;
    });

    setFieldErrors((currentErrors) => {
      if (!currentErrors[field] && !(field === "password" && currentErrors.confirmPassword)) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [field]: undefined,
        ...(field === "password" ? { confirmPassword: undefined } : {})
      };
    });
  }

  function handleSlugBlur() {
    const normalizedValue = normalizeBusinessSlug(form.businessSlug);
    setForm((currentForm) => ({
      ...currentForm,
      businessSlug: normalizedValue
    }));
    setHasCustomSlug(normalizedValue.length > 0);
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Get Started
          </p>
          <CardTitle className="text-xl sm:text-2xl">Create your store</CardTitle>
          <CardDescription>
            Set up your restaurant, cafe, or food business in just a few minutes.
            You'll get a dashboard, menu builder, and QR ordering right away.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Store Name"
                htmlFor="businessName"
                error={fieldErrors.businessName}
              >
                <Input
                  id="businessName"
                  autoComplete="organization"
                  placeholder="Bangalore Benne Dose"
                  value={form.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Store ID"
                htmlFor="businessSlug"
                hint="Used in your login and QR links"
                error={fieldErrors.businessSlug}
              >
                <Input
                  id="businessSlug"
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholder="bangalore-benne-dose"
                  value={form.businessSlug}
                  onChange={(event) => updateField("businessSlug", event.target.value)}
                  onBlur={handleSlugBlur}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Your Name" htmlFor="ownerName" error={fieldErrors.ownerName}>
                <Input
                  id="ownerName"
                  autoComplete="name"
                  placeholder="Adarsh Kumar"
                  value={form.ownerName}
                  onChange={(event) => updateField("ownerName", event.target.value)}
                  required
                />
              </Field>

              <Field label="Type of Business" htmlFor="businessType" error={fieldErrors.businessType}>
                <Select
                  id="businessType"
                  value={form.businessType}
                  onChange={(event) => updateField("businessType", event.target.value)}
                >
                  {registrationBusinessTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email" htmlFor="email" error={fieldErrors.email}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@business.com"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Phone Number"
                htmlFor="phone"
                hint="Optional"
                error={fieldErrors.phone}
              >
                <Input
                  id="phone"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Password"
                htmlFor="password"
                hint="Use at least 8 characters with uppercase, lowercase, and a number."
                error={fieldErrors.password}
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Confirm Password"
                htmlFor="confirmPassword"
                error={fieldErrors.confirmPassword}
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-secondary/45 px-4 py-4 text-sm text-muted-foreground">
              We'll create your store with a Counter and Takeaway source automatically.
              You can add more tables and customize everything later.
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="sm:flex-1" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Create My Store"}
              </Button>
              <Button asChild className="sm:flex-1" size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function validateRegisterForm(form) {
  const nextErrors = {};
  const normalizedSlug = normalizeBusinessSlug(form.businessSlug);

  if (form.businessName.trim().length < 2) {
    nextErrors.businessName = "Business name must be at least 2 characters.";
  }

  if (!normalizedSlug) {
    nextErrors.businessSlug = "Use letters or numbers to create a valid slug.";
  } else if (normalizedSlug.length > 80) {
    nextErrors.businessSlug = "Business slug must be 80 characters or fewer.";
  }

  if (form.ownerName.trim().length < 2) {
    nextErrors.ownerName = "Owner name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password) || form.password.length < 8) {
    nextErrors.password =
      "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
  }

  if (form.confirmPassword !== form.password) {
    nextErrors.confirmPassword = "Passwords do not match.";
  }

  if (!registrationBusinessTypeOptions.some((option) => option.value === form.businessType)) {
    nextErrors.businessType = "Choose a supported business type.";
  }

  if (form.phone.trim() && !/^[0-9+\-()\s]{7,32}$/.test(form.phone.trim())) {
    nextErrors.phone = "Enter a valid phone number or leave it blank.";
  }

  return nextErrors;
}
