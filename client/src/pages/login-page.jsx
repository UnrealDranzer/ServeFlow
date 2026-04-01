import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    businessSlug: "",
    email: "",
    password: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!auth.isBootstrapped || auth.status === "loading") {
    return (
      <FullPageSpinner
        title="Checking your workspace"
        description="Restoring any active ServeFlow session before showing sign in."
      />
    );
  }

  if (auth.isAuthenticated) {
    return <Navigate to={location.state?.from || "/app/dashboard"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await auth.login(form);
      navigate(location.state?.from || "/app/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to sign in to this business workspace."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field) {
    return (event) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value
      }));
    };
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Secure Sign In
          </p>
          <CardTitle>Access your business dashboard</CardTitle>
          <CardDescription>
            Use your business slug, account email, and password. Access tokens stay in memory,
            and refresh sessions remain cookie-scoped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="businessSlug">Business slug</Label>
              <Input
                id="businessSlug"
                autoComplete="organization"
                placeholder="blue-mug-cafe"
                value={form.businessSlug}
                onChange={updateField("businessSlug")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="owner@business.com"
                value={form.email}
                onChange={updateField("email")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={updateField("password")}
                required
              />
            </div>
            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in to ServeFlow"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
