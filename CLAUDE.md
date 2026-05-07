# CLAUDE.md — Solola's v3

Convenciones y decisiones del proyecto. Léelo antes de tocar código.

## Contexto

Sistema de gestión para **Solola's** (Santiago, RD): repostería + catering + taller culinario. Reemplazo de `cursos.cibaocustom.com`. La especificación completa vive en `PLAN-SOLOLAS.md` — ese es el documento de verdad para alcance y modelo de datos.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (PostCSS) — paleta de marca definida en `src/app/globals.css` con `@theme`
- **Drizzle ORM** + **Postgres** — schema en `src/lib/db/schema/`, migraciones en `drizzle/`
- **Supabase** para Auth, Storage, Realtime y Postgres (helpers en `src/lib/supabase/`)
- **react-hook-form** + **zod** para formularios
- **shadcn/ui** (componentes se agregan a demanda en `src/components/ui/`)
- **Resend** + **React Email** para correo (Fase 1+)
- **pnpm** como package manager

## Estructura

```
src/
  app/                  # App Router
    page.tsx            # Landing público
    admin/              # Panel admin (Raizel)
    cocina/             # Vista tablet de cocina
    api/                # Route handlers / Server Actions
  lib/
    db/
      client.ts         # Drizzle client (server-only)
      schema/           # 1 archivo por dominio: people, orders, courses, fiscal, ...
    supabase/
      client.ts         # Supabase browser client
      server.ts         # Supabase server client (RSC)
      middleware.ts     # Refresh de sesión
    utils.ts            # cn(), formatDOP(), formatDate()
  components/
    ui/                 # shadcn primitives
  middleware.ts         # Edge middleware (auth refresh)
drizzle/                # Migraciones SQL generadas
PLAN-SOLOLAS.md         # Especificación completa
```

## Convenciones

### Idioma y locale

- **Todo en español de RD.** Etiquetas, mensajes, validaciones, comentarios.
- Moneda `RD$` (`formatDOP` en `src/lib/utils.ts`).
- Fechas `DD/MM/YYYY` con timezone `America/Santo_Domingo` (AST, sin DST).
- Validación de cédula RD (11 dígitos, Luhn modificado) y RNC (9 dígitos).

### Modelo de datos (lo crítico de v3)

- **`people` es una sola tabla** con flags `is_cliente` / `is_estudiante`. NO duplicar.
- **`product_categories` solo tiene Dulces y Salados**, cada una bound a `area_cocina` (`postres` / `salados`). Subcategorías van en `products.subcategoria` como texto libre.
- **`order_items.listo`** lo marca cocina. Un pedido pasa a `estatus_produccion = 'listo'` solo cuando TODOS sus items están listos (validar en código, no solo en UI).
- **`order_references`** se preserva al editar un pedido. Nunca borrar en cascada al editar — solo al eliminar el pedido completo o el item específico (con confirmación).
- **NCF** (`ncf_sequences`): no exponer la lista cruda; agrupar por tipo y mostrar progreso.

### Drizzle

- Schemas en TS, snake_case en DB, camelCase en TS. El nombre de columna lo damos explícito en `text("nombre_db")`.
- Para generar migración: `pnpm db:generate`.
- Para aplicar a Supabase remoto: `pnpm db:push` (requiere `DIRECT_DATABASE_URL`).
- Tipos derivados con `$inferSelect` / `$inferInsert` y reexportados.

### Server Components / Server Actions

- Default a Server Components. Cliente solo cuando hay interactividad real.
- Mutaciones por **Server Actions** con validación zod.
- Acceso a DB solo en código server (`src/lib/db/client.ts` lanza si se importa client-side).

### Paleta y áreas de cocina

- Marca: `brand-50..900` (azul Solola's `#1A6BB8`)
- Postres: `--color-postres` (`#8B5CF6`, morado)
- Salados: `--color-salados` (`#F59E0B`, ámbar)
- Pedido listo: `--color-listo` (`#10B981`, verde)

### Roles (RLS futura)

`admin`, `cajero`, `cocina_postres`, `cocina_salados`, `contable`. Cocina ve la otra área pero en solo lectura.

## Comandos

```bash
pnpm dev           # Next dev (Turbopack)
pnpm build         # Build de producción
pnpm typecheck     # tsc --noEmit
pnpm lint          # next lint
pnpm db:generate   # Generar migración desde schema
pnpm db:push       # Aplicar schema a Supabase (necesita .env.local)
pnpm db:studio     # Drizzle Studio
```

## Variables de entorno

Copiar `.env.example` a `.env.local`. Nunca commitear `.env.local`. Para `db:push` se necesita `DIRECT_DATABASE_URL` (Supabase → Database → Connection string → Session mode, port 5432).

## Estado actual

**Fase 0 — Setup completada.** Migración inicial generada (`drizzle/0000_*.sql`) con 17 tablas. Layouts base de `/admin` y `/cocina` montados como stubs. Próximo paso: Fase 1 (núcleo de pedidos), siguiendo `PLAN-SOLOLAS.md` § 9.

## Reglas para Claude Code

- **No avanzar de fase sin confirmación explícita** del usuario.
- **No mezclar fases** en un mismo PR.
- Antes de tocar el schema, releer `PLAN-SOLOLAS.md` § 4.
- Antes de un flujo nuevo, releer la subsección correspondiente de § 5.
- Antes de tocar cualquier pantalla, releer la sección de `docs/AUDITORIA-APP-ACTUAL.md` que corresponde — es el contrato mínimo de funcionalidad que la app v3 debe cubrir.
- Commits chicos y descriptivos. Diffs revisables.
- Tests para lógica fiscal (ITBIS, NCF, validación de cédula/RNC) son obligatorios cuando se implemente esa parte.

## Principios de producto (no negociables)

### Todo funcional desde el primer commit

Cada pantalla arranca con **datos reales de la base**. Cero placeholders, cero mockups. Si una métrica del dashboard está en 0 es porque la consulta SQL devolvió 0, no porque sea decorativa. Esto aplica a:

- Dashboard de admin (4 cards de métricas + las nuevas)
- Pizarras (eventos cargados de `orders`)
- Historial de pagos / pedidos (paginación + filtros funcionales contra DB)
- Resumen de producción (calculado de `order_items` filtrados por rango)
- Reportes (consultas reales con totales, no datos hardcoded)
- Listas (Personas, Productos, Cursos, etc.)

Si una sección no se puede llenar con consultas reales todavía (porque depende de otra fase), no se construye su UI hasta que esté la data.

### Separación operativo vs configuración

**Sidebar principal** (lo del día a día — lo que el usuario abre todos los días):
- Inicio · Personas · Productos · Pedidos (Tomar / Pizarras) · Cursos · Reportes

**`/admin/configuracion`** (oculto, solo para ajustes — el usuario entra raramente):
- Mi Negocio (datos del recibo)
- Usuarios del sistema y roles
- Métodos / Formas de pago
- Tipos de comprobante (NCF)
- Secuencias NCF (vista por tipo con progreso, NUNCA la lista cruda de miles de NCF)
- Categorías de producto, subcategorías, rellenos, unidades de medida
- Suplidores (si se mantiene)

Regla de decisión: si Raizel lo necesita una vez por mes o menos, va en Configuración. Si lo abre todos los días, va en el sidebar principal.
