import { Outlet } from "react-router-dom";
import { AppLogo } from "@/components/app-logo";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(162,127,69,0.18),transparent_28%),linear-gradient(180deg,#fcfaf6_0%,#efe7da_100%)]">
      <div className="page-edge relative py-3 sm:py-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(198,165,111,0.22),transparent_70%)] blur-3xl" />
        <header className="sticky top-3 z-20 mb-5 flex items-center justify-between rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,243,232,0.9))] px-4 py-3 shadow-sm backdrop-blur sm:top-4 sm:mb-6 sm:rounded-[32px] sm:px-6 sm:py-4">
          <AppLogo />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Guest Ordering
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Premium QR dining experience
            </p>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
