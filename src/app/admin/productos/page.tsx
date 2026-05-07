import Link from "next/link";
import { Plus, ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  listCategoriasActivas,
  listProductos,
} from "@/lib/productos/queries";
import {
  AREA_LABELS,
  type AreaCocinaValue,
} from "@/lib/categorias/schema";
import { formatDOP } from "@/lib/utils";

import { ProductoFormDialog } from "./producto-form-dialog";
import { ProductoRowActions } from "./producto-row-actions";
import { ProductosSearch } from "./productos-search";
import { ProductosTabs } from "./productos-tabs";
import { PersonasPagination } from "../personas/personas-pagination";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    area?: string;
    q?: string;
    page?: string;
  }>;
}

function parseArea(v: string | undefined): "postres" | "salados" | undefined {
  if (v === "postres" || v === "salados") return v;
  return undefined;
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const area = parseArea(params.area);
  const search = params.q?.trim() ?? undefined;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [categorias, list] = await Promise.all([
    listCategoriasActivas(),
    listProductos({ area, search, page }),
  ]);

  if (categorias.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Productos
          </h1>
          <p className="text-sm text-neutral-500">
            Catálogo del taller, separado por área de cocina.
          </p>
        </header>
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-700">
            Antes de crear productos necesitas al menos una categoría.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/configuracion/categorias">
              Crear categorías
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Productos
          </h1>
          <p className="text-sm text-neutral-500">
            Catálogo del taller, separado por área de cocina.
          </p>
        </div>
        <ProductoFormDialog
          mode={{ kind: "create" }}
          categorias={categorias}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          }
        />
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <ProductosTabs current={area ?? "todos"} />
        <ProductosSearch />
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Foto</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">ITBIS</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 ? (
              <TableEmpty
                message={
                  search
                    ? "No se encontraron productos con esa búsqueda."
                    : "Aún no hay productos. Crea el primero con el botón."
                }
              />
            ) : (
              list.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-neutral-50">
                      {p.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagenUrl}
                          alt={p.descripcion}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-neutral-300" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-neutral-900">
                      {p.descripcion}
                    </div>
                    {p.subcategoria && (
                      <div className="text-xs text-neutral-500">
                        {p.subcategoria}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: p.categoria.colorHex }}
                      />
                      <div>
                        <div className="text-sm">{p.categoria.nombre}</div>
                        <div className="text-xs text-neutral-500">
                          {AREA_LABELS[p.categoria.areaCocina as AreaCocinaValue]}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatDOP(p.precio)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-neutral-600">
                    {Number(p.itbisPct).toFixed(0)}%
                  </TableCell>
                  <TableCell>
                    {p.activo ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProductoRowActions
                      producto={p}
                      categorias={categorias}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <PersonasPagination
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
      />
    </div>
  );
}
