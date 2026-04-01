export function FullPageSpinner({ title = "Loading ServeFlow", description = "Preparing your workspace." }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-panel flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <div className="space-y-1">
          <h2 className="text-2xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
