import { Separator } from "@/components/ui/separator";

export function PageShell({ title, description, actions, children }) {
  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            ServeFlow Admin
          </p>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl">{title}</h1>
            {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
      <Separator />
      {children}
    </section>
  );
}
