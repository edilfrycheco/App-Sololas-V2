import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand-600">
          Solola&apos;s
        </h1>
        <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
          Taller Culinario &amp; Catering
        </p>
      </div>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Sistema de gesti&oacute;n v3. Fase 0 (setup) completada.
      </p>
      <div className="flex gap-4">
        <Link
          href="/admin"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Panel admin
        </Link>
        <Link
          href="/cocina"
          className="rounded-md border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          Vista cocina
        </Link>
      </div>
    </main>
  );
}
