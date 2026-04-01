import { Flame, PanelsTopLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({ className }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <Flame className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl leading-none tracking-tight">ServeFlow</span>
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Dining Ops SaaS
        </span>
      </div>
    </div>
  );
}

export function AppLogoMark({ className }) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm",
        className
      )}
    >
      <PanelsTopLeft className="h-5 w-5" />
    </div>
  );
}
