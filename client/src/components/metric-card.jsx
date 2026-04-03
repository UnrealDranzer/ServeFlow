import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, note, icon: Icon, className }) {
  return (
    <Card className={cn("border-none bg-white shadow-sm transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/65">
            {label}
          </p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
            {Icon ? <Icon className="h-4 w-4" /> : null}
          </div>
        </div>
        <p className="font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
        {note ? (
          <p className="mt-2 text-[11px] font-medium leading-relaxed text-muted-foreground">{note}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
