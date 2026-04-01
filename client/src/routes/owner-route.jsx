import { Navigate } from "react-router-dom";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { useAuth } from "@/features/auth/use-auth";

export function OwnerRoute({ children }) {
  const auth = useAuth();

  if (!auth.isBootstrapped || auth.status === "loading") {
    return <FullPageSpinner />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (auth.user?.role !== "owner") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
