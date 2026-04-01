import { AppLogo } from "@/components/app-logo";

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-grain-gradient">
      <div className="page-edge grid min-h-screen gap-10 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-10">
        <div className="hidden rounded-[36px] bg-[linear-gradient(180deg,rgba(60,76,39,0.96),rgba(27,37,24,0.98))] p-8 text-white shadow-glow lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <AppLogo className="[&_span:last-child]:text-white/70" />
            <div className="max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                Restaurant Operations Control
              </p>
              <h1 className="font-display text-6xl leading-[1.05] text-white">
                Run dine-in, QR, and counter orders from one secure workspace.
              </h1>
              <p className="text-base leading-7 text-white/72">
                ServeFlow gives food businesses a production-ready dashboard for live orders,
                menu management, and daily sales without compromising tenant isolation.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="Order Modes" value="QR + Manual" />
            <MetricCard label="Isolation" value="Tenant Scoped" />
            <MetricCard label="Pace" value="Shift Ready" />
          </div>
        </div>
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-3 font-display text-2xl text-white">{value}</p>
    </div>
  );
}
