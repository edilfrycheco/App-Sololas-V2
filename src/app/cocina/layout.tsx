export default function CocinaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-brand-700">
              Solola&apos;s · Cocina
            </h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Vista tablet
            </p>
          </div>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
