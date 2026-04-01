import { Flame, PanelsTopLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({ className }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Flame className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-lg font-extrabold leading-none tracking-tighter">SERVEFLOW</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          RESTAURANT OPS
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
