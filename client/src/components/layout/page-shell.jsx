import { Separator } from "@/components/ui/separator";

export function PageShell({ title, description, actions, children }) {
  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl">{title}</h1>
          {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:w-auto md:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
      <Separator />
      {children}
    </section>
  );
}
