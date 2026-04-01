import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { orderStatusMeta } from "@/lib/status";

export function StatusBadge({ status }) {
  const meta = orderStatusMeta[status] || {
    label: status,
    classes: "bg-muted text-foreground border-border"
  };

  return (
    <Badge
      variant="outline"
      className={cn("border font-semibold normal-case tracking-normal", meta.classes)}
    >
      {meta.label}
    </Badge>
  );
}
