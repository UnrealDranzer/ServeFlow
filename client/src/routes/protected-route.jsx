import { Navigate, useLocation } from "react-router-dom";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { useAuth } from "@/features/auth/use-auth";

export function ProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isBootstrapped || auth.status === "loading") {
    return (
      <FullPageSpinner
        title="Restoring your session"
        description="Checking your business workspace and active access token."
      />
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
