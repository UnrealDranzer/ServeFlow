import { Separator } from "@/components/ui/separator";

export function PageShell({ title, description, actions, children }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            ServeFlow Admin
          </p>
          <div className="space-y-1">
            <h1 className="text-4xl">{title}</h1>
            {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      <Separator />
      {children}
    </section>
  );
}
