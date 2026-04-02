import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const prefilledBusinessSlug = searchParams.get("businessSlug") || "";
  const prefilledEmail = searchParams.get("email") || "";
  const wasJustRegistered = searchParams.get("registered") === "1";
  const [form, setForm] = useState({
    businessSlug: prefilledBusinessSlug,
    email: prefilledEmail,
    password: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm((currentForm) => ({
      ...currentForm,
      businessSlug: prefilledBusinessSlug,
      email: prefilledEmail
    }));
  }, [prefilledBusinessSlug, prefilledEmail]);

  if (!auth.isBootstrapped || auth.status === "loading") {
    return (
      <FullPageSpinner
        title="Loading..."
        description="Checking if you're already signed in."
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
      setErrorMessage(getApiErrorMessage(error, "Wrong store ID, email, or password. Please try again."));
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
        <CardHeader className="space-y-2 sm:space-y-3">
          <CardTitle className="text-xl sm:text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with your store ID and account details to manage your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {wasJustRegistered ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
                Your store is ready! Sign in with the email and store ID you just created.
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="businessSlug">Store ID</Label>
              <Input
                id="businessSlug"
                autoComplete="organization"
                placeholder="e.g. blue-mug-cafe"
                value={form.businessSlug}
                onChange={updateField("businessSlug")}
                required
              />
              <p className="text-xs text-muted-foreground">The unique name you chose when you set up your store.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
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
                placeholder="Your password"
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
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            <div className="flex flex-col gap-3 rounded-[24px] border border-border/60 bg-secondary/45 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>New here? Set up your store first.</p>
              <Button asChild variant="outline">
                <Link to="/register">Create Store</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
