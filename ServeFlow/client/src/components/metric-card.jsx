import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, note, icon: Icon, className }) {
  return (
    <Card className={cn("overflow-hidden bg-white/92", className)}>
      <CardContent className="relative p-6">
        <div className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-5 max-w-[12rem] font-display text-4xl leading-none">{value}</p>
        {note ? <p className="mt-3 text-sm text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  );
}
