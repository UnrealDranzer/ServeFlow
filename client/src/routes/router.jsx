import { Navigate, createBrowserRouter, useRouteError } from "react-router-dom";
import { AdminLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { useAuth } from "@/features/auth/use-auth";
import { ProtectedRoute } from "@/routes/protected-route";
import { OwnerRoute } from "@/routes/owner-route";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { OrdersPage } from "@/pages/orders-page";
import { ManualOrderPage } from "@/pages/manual-order-page";
import { CategoriesPage } from "@/pages/categories-page";
import { MenuItemsPage } from "@/pages/menu-items-page";
import { OrderSourcesPage } from "@/pages/order-sources-page";
import { SettingsPage } from "@/pages/settings-page";
import { PublicMenuPage } from "@/pages/public-menu-page";
import { CartPage } from "@/pages/cart-page";
import { OrderSuccessPage } from "@/pages/order-success-page";
import { NotFoundPage } from "@/pages/not-found-page";

function RootRedirect() {
  const auth = useAuth();

  if (!auth.isBootstrapped || auth.status === "loading") {
    return (
      <FullPageSpinner
        title="Launching ServeFlow"
        description="Verifying your current business session."
      />
    );
  }

  return <Navigate to={auth.isAuthenticated ? "/app/dashboard" : "/login"} replace />;
}

function RouteErrorPage() {
  const error = useRouteError();
  const message =
    error?.statusText || error?.message || "Something went wrong while loading this route.";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Route Load Error</CardTitle>
          <CardDescription>
            ServeFlow could not finish loading the requested page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild>
            <a href="/app/dashboard">Return to dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/register",
    element: <RegisterPage />
  },
  {
    path: "/signup",
    element: <Navigate to="/register" replace />
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />
      },
      {
        path: "dashboard",
        element: <DashboardPage />
      },
      {
        path: "orders",
        element: <OrdersPage />
      },
      {
        path: "orders/new",
        element: <ManualOrderPage />
      },
      {
        path: "categories",
        element: (
          <OwnerRoute>
            <CategoriesPage />
          </OwnerRoute>
        )
      },
      {
        path: "menu-items",
        element: (
          <OwnerRoute>
            <MenuItemsPage />
          </OwnerRoute>
        )
      },
      {
        path: "order-sources",
        element: (
          <OwnerRoute>
            <OrderSourcesPage />
          </OwnerRoute>
        )
      },
      {
        path: "settings",
        element: (
          <OwnerRoute>
            <SettingsPage />
          </OwnerRoute>
        )
      }
    ]
  },
  {
    path: "/menu/:businessSlug/:sourceSlug",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <PublicMenuPage />
      },
      {
        path: "cart",
        element: <CartPage />
      },
      {
        path: "success",
        element: <OrderSuccessPage />
      }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
