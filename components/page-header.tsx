interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight leading-none">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </div>
  );
}
