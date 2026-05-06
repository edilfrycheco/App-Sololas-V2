# Plan Técnico — Sistema Solola's v3

**Repostería, Catering y Taller Culinario · República Dominicana**

> Documento de especificación para reconstruir el sistema actual `cursos.cibaocustom.com` con arquitectura moderna, mejor UX y las funcionalidades faltantes identificadas durante el uso.

---

## 1. Resumen ejecutivo

Solola's opera dos negocios bajo un mismo techo:

1. **Taller culinario** — cursos y diplomados con inscripciones, pagos parciales y facturación fiscal.
2. **Repostería y catering** — pedidos personalizados con producción dividida en dos áreas (postres / salados) y entrega programada.

El sistema actual cubre ambos pero tiene problemas concretos: recibos mal diseñados, base de clientes y estudiantes mezclada sin distinción clara, productos sin separación visual por área de producción, ausencia de flujo en tablets para los empleados de cocina, y reportes con poca capacidad de filtrado.

Este plan reconstruye todo desde cero como una aplicación web moderna, manteniendo la lógica de negocio probada y resolviendo cada punto anotado en la auditoría.

---

## 2. Stack técnico recomendado

| Capa          | Tecnología                                | Por qué                                                               |
| ------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Framework     | **Next.js 15** (App Router) + TypeScript  | SSR/RSC, una sola base para web y tablets, excelente para Claude Code |
| Base de datos | **PostgreSQL** vía **Supabase**           | Auth, storage de imágenes, realtime para tablets, todo integrado      |
| ORM           | **Drizzle ORM**                           | Type-safe, schemas en TS, migraciones limpias                         |
| UI            | **Tailwind CSS 4** + **shadcn/ui**        | Componentes accesibles, fácil de personalizar                         |
| Auth          | **Supabase Auth**                         | Roles por RLS, login simple                                           |
| Realtime      | **Supabase Realtime**                     | Tablets de cocina sincronizadas en vivo                               |
| Storage       | **Supabase Storage**                      | Fotos de referencias de pedidos                                       |
| Email         | **Resend** + **React Email**              | Recibos PDF y notificaciones                                          |
| PDF           | **react-pdf** o **@react-pdf/renderer**   | Generación de recibos con logo                                        |
| Calendario    | **FullCalendar React**                    | Pizarras tipo agenda con drag/drop                                    |
| Forms         | **react-hook-form** + **zod**             | Validación type-safe                                                  |
| Tablas        | **TanStack Table**                        | Filtros, ordenamiento, exportación                                    |
| Charts        | **Recharts**                              | Dashboards con gráficos                                               |
| Excel         | **SheetJS** o **exceljs**                 | Exportación de reportes                                               |
| Hosting       | **Vercel** + **Supabase**                 | Deploy automático desde Git                                           |

**Idioma:** todo en español (RD). Formato de fecha `DD/MM/YYYY`, moneda `DOP`, decimales con coma o punto según preferencia (recomiendo punto: `RD$ 4,200.00`).

---

## 3. Arquitectura general

```
┌─────────────────────────────────────────────────┐
│                  Next.js App                     │
├─────────────────────────────────────────────────┤
│  /admin       → Panel completo (Raizel)         │
│  /cocina      → Vista tablet (empleados)        │
│  /cliente     → Portal cliente (futuro)         │
│  /api         → Endpoints REST/Server Actions   │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Supabase Backend                    │
│  PostgreSQL · Auth · Storage · Realtime          │
└─────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Resend       SheetJS         FullCalendar
     (emails)    (exports)        (pizarras)
```

**Subdominios sugeridos:**

- `app.sololasrd.com` — admin principal
- `cocina.sololasrd.com` — tablets de cocina (PWA optimizada)
- `api.sololasrd.com` — endpoints públicos (futuro)

---

## 4. Modelo de datos (schema)

### 4.1 Personas (clientes y estudiantes unificados)

> **Mejora clave:** la auditoría señala que la base actual mezcla clientes y estudiantes. La solución no es duplicar, sino tener **una tabla `people`** con dos flags booleanos: una persona puede ser estudiante, cliente, o ambos.

```ts
people {
  id: uuid (PK)
  nombres: text
  apellidos: text
  cedula_rnc: text (nullable, unique)
  telefono: text
  celular: text
  correo: text
  direccion: text (nullable)
  is_cliente: boolean (default false)
  is_estudiante: boolean (default false)
  notas: text (nullable)
  created_at, updated_at
}
```

En el formulario de creación habrá dos checkboxes: "Es cliente de pedidos" / "Es estudiante de cursos". Los listados pueden filtrar por uno, otro o ambos.

### 4.2 Usuarios del sistema (operadores)

```ts
system_users {
  id: uuid (PK, ref auth.users)
  nombres: text
  apellidos: text
  rol: enum('admin', 'cajero', 'cocina_postres', 'cocina_salados', 'contable')
  area_cocina: enum('postres', 'salados', null)  -- solo para roles cocina_*
  tablet_id: text (nullable)  -- identificador físico de la tablet
  activo: boolean
}
```

### 4.3 Módulo Clases

```ts
courses {
  id, nombre, descripcion, costo, frecuencia, duracion, cantidad_pagos,
  activo, created_at
}

course_sessions {  -- "habilitar curso" en el sistema actual
  id, course_id (FK), fecha_inicio, fecha_fin,
  hora_inicio, hora_fin, dias_semana: jsonb,  -- ['lunes','miercoles']
  impartido_por: uuid (FK system_users),
  limite_estudiantes: int,
  estatus: enum('programado', 'en_curso', 'finalizado', 'cancelado')
}

enrollments {
  id, course_session_id (FK), person_id (FK people),
  fecha_inscripcion, costo_acordado, descuento,
  estatus_pago: enum('pendiente', 'parcial', 'pagado'),
  -- el "color" verde/amarillo del sistema actual sale de aquí
}

course_payments {
  id, enrollment_id (FK), monto, fecha,
  metodo_pago_id (FK), tipo_comprobante_id (FK),
  numero_comprobante: text (e-NCF),
  numero_referencia: text,
  concepto: text,  -- '1ER PAGO', '2DO PAGO', 'ABONO', etc.
  recibo_url: text,  -- PDF generado
  registrado_por: uuid
}
```

### 4.4 Módulo Pedidos

```ts
product_categories {
  id, nombre,  -- solo 'Dulces' y 'Salados' (mejora del actual)
  area_cocina: enum('postres', 'salados'),
  color_hex: text  -- para diferenciación visual en pizarras
}

products {
  id, descripcion, category_id (FK), precio, costo, itbis_pct,
  unidad_medida, lleva_ingredientes: boolean,
  imagen_url: text, activo: boolean
}

orders {
  id, person_id (FK people), tema: text,  -- 'Cumpleaños Mason'
  fecha_entrega: timestamp, hora_entrega: time,
  delivery: boolean, direccion_delivery: text (nullable),
  nota_general: text,
  total_bruto, total_itbis, total_neto,
  estatus_pago: enum('pendiente', 'parcial', 'pagado'),
  estatus_produccion: enum('pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'),
  -- 'listo' marca el pedido en verde en el calendario
  created_at, created_by
}

order_items {
  id, order_id (FK), product_id (FK),
  cantidad, precio_unitario, itbis_unitario, neto,
  relleno: text (nullable), topping: text (nullable),
  decoracion: text (nullable),
  notas: text,
  listo: boolean (default false),  -- marcado por cocina
  marcado_listo_por: uuid (nullable),
  marcado_listo_at: timestamp (nullable)
}

order_references {
  id, order_id (FK), product_id (FK nullable),
  -- referencia puede ser de un producto específico o del pedido completo
  imagen_url: text,
  nota: text
}

order_payments {
  id, order_id (FK), monto, fecha, metodo_pago_id, tipo_comprobante_id,
  numero_comprobante, numero_referencia, recibo_url,
  registrado_por
}
```

### 4.5 Configuración fiscal (DGII RD)

```ts
ncf_types {
  id, codigo: text,  -- 'B01', 'B02', 'B14', 'B15', 'B04', 'B03'
  nombre: text,  -- 'Crédito Fiscal', 'Factura de Consumo', 'Gubernamental', etc.
  prefijo: text  -- 'B02000005706'
}

ncf_sequences {
  id, ncf_type_id (FK), secuencia_actual: int,
  secuencia_inicial: int, secuencia_final: int,
  fecha_vencimiento: date,
  cantidad_alerta_reorden: int
}

payment_methods {
  id, nombre,  -- 'Efectivo', 'Tarjeta de Crédito', 'Transferencia', 'Cheque', 'Orden de Crédito', 'Pedido a Crédito'
  activo: boolean,
  requiere_referencia: boolean
}
```

### 4.6 Configuración del negocio

```ts
business_settings {
  id (singleton),
  nombre_comercial: text,  -- "Solola's"
  razon_social: text,
  rnc: text,
  direccion: text,
  telefono: text,
  correo: text,
  logo_url: text,
  recibo_template: text,  -- HTML del template
  email_smtp_*: ...
}
```

---

## 5. Módulos y funcionalidades

### 5.1 Login y dashboard

**Auditoría:** la pantalla de login actual está bien pero genérica.

**Mejoras:**

- Logo de Solola's en lugar del texto plano.
- Diseño limpio con la paleta de marca.
- Opción "Recordar dispositivo" para tablets de cocina (sesión larga).
- Reset de contraseña por correo.

**Dashboard principal (admin):**
Mantener las 4 métricas grandes del actual pero hacerlas clickeables y agregar:

- Cursos totales / con cupos / agotados / estudiantes con atraso (existente)
- **Pedidos del día** (nuevo)
- **Pedidos por entregar esta semana** (nuevo)
- **Ingresos del mes** (nuevo, con comparativa vs mes anterior)
- **Productos más pedidos del mes** (nuevo)
- **Cuentas por cobrar** (nuevo, suma de balances pendientes)

### 5.2 Personas (clientes / estudiantes unificados) ⚠️ MEJORA CLAVE

Reemplaza las dos tablas separadas del sistema actual.

**Vista de listado:**

- Tabs: `Todos` · `Clientes` · `Estudiantes` · `Ambos`
- Filtros: nombre, cédula/RNC, teléfono, correo
- Acción rápida: "Crear" abre modal con el formulario completo

**Formulario de creación/edición:**

```
┌─ Datos básicos ───────────────────┐
│ Nombres:        [_______________] │
│ Apellidos:      [_______________] │
│ Cédula/RNC:     [_______________] │
│ Teléfono:       [_______________] │
│ Celular:        [_______________] │
│ Correo:         [_______________] │
│ Dirección:      [_______________] │
├─ Tipo de relación ────────────────┤
│ ☐ Es cliente de pedidos           │
│ ☐ Es estudiante de cursos         │
├─ Notas internas ──────────────────┤
│ [_______________________________] │
└───────────────────────────────────┘
```

Una persona puede tener ambos checks. En las listas y selects de pedidos solo aparecerán las que tengan `is_cliente=true`; en inscripciones de cursos solo las que tengan `is_estudiante=true`.

### 5.3 Cursos

**Listado de cursos** (catálogo): mantener tabla actual con nombre, descripción, costo, frecuencia, duración, cantidad de pagos.

**Habilitar curso** (sesiones): mantener flujo actual con fecha inicio/fin, días de la semana, hora, límite de estudiantes, instructor.

**Inscribir estudiantes** (vista de un curso habilitado):

- Filtro por color: **verde = pagado al 100%**, **amarillo = abono parcial**, **rojo = pendiente sin pagar** (mejora: agregar rojo).
- Buscador en línea que filtre la persona ya con `is_estudiante=true`.
- Si se busca y no existe, botón "Crear nueva persona" abre el modal de personas con `is_estudiante` precheckeado.
- Botón "Registrar pago" abre modal de pago.

**Modal de pago de inscripción:**

- Método de pago (select)
- Monto
- Concepto (1er Pago, 2do Pago, Abono, etc.)
- Número de referencia
- Tipo de comprobante (Crédito Fiscal, Factura de Consumo, Gubernamental, Nota de Crédito, Nota de Débito, Régimen Especial)
- Generar e-NCF automáticamente desde la secuencia
- Botón "Registrar Pago" → genera PDF, lo envía al correo del estudiante

### 5.4 Recibo PDF ⚠️ MEJORA CRÍTICA

**Auditoría:** "el recibo se ve simple y con errores. Colocar logo de Sololas."

**Nuevo template (componente React + react-pdf):**

```
┌────────────────────────────────────────────────────┐
│  [LOGO SOLOLAS]              Solola's              │
│                          TALLER CULINARIO & CATERING│
│                                                    │
│  Av. República de Argentina #54, Rincón Largo,    │
│  Santiago, República Dominicana                    │
│  info@sololasrd.com  ·  (809) 879-2450            │
│  RNC: XXX-XXXXX-X                                  │
├────────────────────────────────────────────────────┤
│  Recibo de Pago                       No. 1488     │
│  Fecha: 05/05/2026 02:32 AM                        │
│  Atendido por: Raizel Brito                        │
│                                                    │
│  Cliente:    Raquel Quezada                        │
│  RNC:        ─                                     │
│  Contacto:   829-912-6762                          │
│  Correo:     [...]                                 │
├────────────────────────────────────────────────────┤
│  Tipo de comprobante:  Factura de Consumo          │
│  e-NCF:                B0200005720                 │
│  Forma de pago:        Orden de Crédito            │
│  No. Transacción:      1231                        │
├────────────────────────────────────────────────────┤
│  Cant.  Producto                  Precio    Total  │
│  ─────  ────────────────────────  ────────  ────── │
│   12    Cupcakes Vainilla         125.00   1500.00 │
│         "Topper impreso..."                        │
│   12    Rice Crispy               225.00   2700.00 │
│         "Mason Marcelo, 1 año..."                  │
├────────────────────────────────────────────────────┤
│                          Subtotal:        4200.00  │
│                          ITBIS (0%):         0.00  │
│                          Total:           4200.00  │
│                          Recibido:           1.00  │
│                          Balance:         4199.00  │
├────────────────────────────────────────────────────┤
│              ¡Gracias por preferirnos!             │
│   Solola's · Cocinando momentos memorables         │
└────────────────────────────────────────────────────┘
```

Especificaciones:

- **Logo de Solola's** arriba, con tipografía coherente.
- Margen y espaciado generosos.
- Tipografía legible (Inter o similar para web, Roboto para PDF).
- Colores de marca (azul Solola's `#1A6BB8` o el oficial).
- Formato A5 vertical (más práctico para impresión térmica si quieren más adelante).
- El PDF se genera y se adjunta automáticamente al correo del cliente.

### 5.5 Productos ⚠️ MEJORA CLAVE

**Auditoría:**

> Solo poner dos categorías (Dulces o Salados) y que a partir de aquí se pueda ver en las tablets de los empleados a los que corresponda ese producto.

**Cambios:**

- La tabla `product_categories` se simplifica a dos categorías base: **Dulces** y **Salados**.
- Cada categoría tiene un `area_cocina` asociada (`postres` o `salados`).
- Cada categoría tiene un `color_hex` que se usará en las pizarras.
- Subcategorías opcionales (Picaderas, Postres, Galletas, etc.) pueden existir como `tags` o un campo `subcategoria` libre, pero **no se mezclan con el área de cocina**.

**Formulario de producto:**

- Descripción
- Categoría (Dulces / Salados) — esto define a qué tablet va
- Subcategoría libre (opcional, para reportes)
- Precio, ITBIS %, costo
- Unidad de medida
- Cantidad para reorden
- Imagen
- Lleva ingredientes (checkbox)
- Activo

### 5.6 Tomar pedido

Mantener las 3 pestañas actuales (Información General · Información del Pedido · Referencias) pero mejorar:

**Información General:**

- Buscador de cliente en vivo (autocomplete) que filtre solo `is_cliente=true`.
- Si no existe, botón "+ Nuevo cliente" abre modal rápido.
- Campos: nombre, apellido, RNC, teléfono, correo, delivery (con dirección si aplica), fecha y hora de entrega, nota general.

**Información del Pedido:**

- Tema del pedido (texto libre, ej: "Cumpleaños Mason Marcelo").
- Tipo de pedido (Postres / Salados / Mixto — calculado automáticamente por los productos).
- Selector de producto con búsqueda.
- Cantidad, precio unitario (auto-llenado pero editable), ITBIS, neto.
- Comentarios/notas por línea.
- Tabla resumen con subtotal, ITBIS, neto.
- Eliminar líneas.

**Referencias:**

- Por cada producto del pedido se pueden subir múltiples imágenes con notas.
- Vista en grilla con thumbnails.
- ⚠️ **Crítico:** al editar un pedido, las referencias y fotos NO se pierden (problema actual reportado).

**Facturar:**

- Forma de pago, tipo de factura, e-NCF auto-generado, monto a pagar, monto recibido, cambio, balance pendiente.
- Checkbox "Enviar por correo".
- Genera PDF y notifica.

### 5.7 Vista cocina (tablets) ⚠️ MEJORA CLAVE

**Auditoría:**

> Que se pueda ver en las tablets de los empleados a los que corresponda ese producto. Que cada uno pueda ver la otra área pero como lector para evitar que se queden pedidos. Que salgan de distintos colores para identificar cada área.

**Nueva vista `/cocina`** (PWA optimizada para tablet, realtime):

```
┌──────────────────────────────────────────────────────┐
│ [≡] Cocina · Postres            [Recargar] [Salir]   │
├──────────────────────────────────────────────────────┤
│ [Mi Área: Postres] [Otra Área: Salados (solo ver)]   │
├──────────────────────────────────────────────────────┤
│ Hoy · 5 may 2026                                     │
│                                                      │
│ ┌─ Pedido #1490 ──────────── 07:30 AM ─────────────┐│
│ │ 🟣 POSTRES   Noemi Almonte                       ││
│ │ Tema: Reunión                                    ││
│ │                                                  ││
│ │ ☐ Empanada de Pollo & Queso (Frita) · 30        ││
│ │   Relleno: pollo · Decoración: -                 ││
│ │   Notas: -                                       ││
│ │                                                  ││
│ │ ☐ Wraps Jamón & Queso c/puerro · 30             ││
│ │                                                  ││
│ │ [Marcar Pedido Listo] [Ver detalle]              ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ ┌─ Pedido #1488 ─── 🟡 SALADOS (solo lectura) ────┐│
│ │ Daniela Lazar — 03:00 PM                         ││
│ │ Bizcocho Vainilla · 1                            ││
│ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Reglas de la vista cocina:**

1. **Filtrado por área:** la tablet solo muestra como editables los items de su área (postres o salados). Los items de la otra área aparecen pero **en solo lectura, con color distinto y badge "Solo lectura"**.
2. **Colores por área:**

- Postres → morado / lavanda (`#8B5CF6`)
- Salados → ámbar / mostaza (`#F59E0B`)
- Pedido completo (todos los items listos) → verde (`#10B981`)

3. **Validación al marcar pedido como listo:**

   ```
   if (todos_los_items_de_mi_area_estan_listos &&
       hay_items_de_la_otra_area_no_listos) {
       mostrar_alerta(
         "Este pedido tiene items de Salados pendientes.
          No puede marcarse como completo sin verificar
          la otra área."
       )
   }
   ```

4. **Notificación al admin:** cuando un pedido pasa a estado `listo` (todos los items listos, ambas áreas), enviar correo a Raizel: "Pedido #1490 listo para entrega — Cliente: Noemi Almonte — Hora entrega: 07:30 AM".
5. **Realtime:** Supabase Realtime sincroniza el estado entre las dos tablets en vivo. Si el empleado de salados marca su parte, el de postres lo ve sin recargar.
6. **PWA instalable:** que la tablet pueda "instalar" la app y abrirla pantalla completa, modo kiosko opcional.

### 5.8 Pizarras (calendario)

Tres vistas con el mismo componente FullCalendar pero filtros diferentes:

**Pizarra General** (`/admin/pizarra`):

- Muestra todos los pedidos.
- Vista mes / semana / día / línea de tiempo.
- Cada pedido es un evento coloreado por estado:
  - Gris claro = pendiente
  - Color del área = en proceso (morado/ámbar/mixto)
  - **Verde = completo (todos los items listos)** ← mejora explícita
  - Tachado = entregado
- Click en evento → modal con detalle.
- Drag para reprogramar (solo admin).

**Pizarra Repostería** (`/admin/pizarra-postres` o filtro):

- Solo muestra pedidos con items de área `postres`.

**Pizarra Salados** (`/admin/pizarra-salados`):

- Solo pedidos con items de área `salados`.

Las pizarras de área también las ven los empleados de cocina, pero los pedidos con items de otra área aparecen translúcidos / como referencia.

### 5.9 Resumen de producción

Mantener la tabla actual (productos x día de la semana) pero agregar:

- Selector de rango (semana actual, próxima semana, mes, personalizado).
- Filtro por área.
- Exportación a Excel y a PDF para imprimir.
- Click en celda muestra qué pedidos contribuyen a esa cantidad.

### 5.10 Detalle de pedido (modal en pizarra) ⚠️ MEJORA

**Auditoría:**

> Si lo modifico, que no se pierdan las fotos o referencias de ese pedido cuando se haya cargado anteriormente.

**Reglas:**

- Editar campos del pedido NO borra referencias.
- Editar líneas de productos: si se elimina un producto que tenía referencias, preguntar antes.
- Cambiar fecha de entrega actualiza el calendario en vivo.
- Botón "Eliminar pedido" pide confirmación con texto del cliente y fecha.
- Botón "Listo para entrega" solo aparece cuando todos los items están marcados.

### 5.11 Comprobantes y NCF

Mantener funcionalmente igual al actual (gestión de secuencias) pero:

- Vista clara de "comprobantes próximos a agotarse" (alerta cuando quedan menos de N).
- Vista de "comprobantes vencidos" (los e-NCF tienen fecha de vencimiento).
- **No mostrar la lista cruda de 10,496 comprobantes**, en su lugar agrupar por tipo y mostrar progreso.

### 5.12 Métodos de pago

**Auditoría:**

> Esto no tengo que verlo como usuario, puede estar en configuración de la página.

Mover de "Opciones" a `/admin/configuracion/metodos-pago`. CRUD igual al actual.

### 5.13 Reportes

**Historial de pagos** (clases + pedidos consolidado o filtrable):

Filtros existentes a mantener:

- # Recibo, Cliente, Tipo de comprobante, Comprobante, Forma de pago, Concepto, Nombre del curso, Rango de fechas, Usuario.

Filtros nuevos a agregar:

- Tipo de operación (Curso / Pedido / Ambos).
- Área de cocina (para pedidos).
- Estatus de pago (pagado / parcial / pendiente).
- Monto desde-hasta.

Mejoras:

- Exportación a Excel mejorada (con totales y formato).
- Exportación a PDF tipo "estado de cuenta".
- Gráfico de ingresos por día/semana/mes en la parte superior.
- Vista resumen con totales por método de pago, por tipo de comprobante.

**Historial de pedidos:**

- Mantener tabla con # Pedido, Factura, Fecha, Cliente, Pedido, Comprobante, Usuario, Recibido, Total, Saldada, Estatus.
- Acción "Hacer pago" para registrar abonos a pedidos pendientes (flujo similar al de inscripciones).
- Filtros adicionales: estatus de producción, área de cocina.

**Cursos / Talleres vendidos:**
Reporte nuevo con cursos y total de inscripciones, ingresos generados, tasa de pagos completados vs pendientes.

**Clientes con atraso:**
Mantener funcionalidad. Agregar acción "Enviar recordatorio por correo" con plantilla amigable.

---

## 6. Roles y permisos

| Rol                | Puede                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Admin** (Raizel) | Todo. Único que ve configuración, comprobantes, eliminar pedidos, ver todos los reportes.                                        |
| **Cajero**         | Tomar pedidos, inscribir estudiantes, registrar pagos. No ve configuración ni puede eliminar.                                    |
| **Cocina Postres** | Ver pizarra postres y general (lectura), marcar items de postres listos, marcar pedidos listos (con validación de área cruzada). |
| **Cocina Salados** | Igual al anterior pero para área salados.                                                                                        |
| **Contable**       | Solo reportes y exportaciones. No modifica nada.                                                                                 |

Implementar con **Supabase Row Level Security (RLS)** + middleware en Next.js para rutas protegidas.

---

## 7. UI/UX guidelines

- **Mobile-first** para vistas de cocina (las tablets son los dispositivos principales ahí).
- **Desktop-first** para admin (más datos, más pantalla).
- Tabla siempre con scroll horizontal en mobile, no comprimir.
- Modales para acciones puntuales, full-page para flujos largos (tomar pedido).
- Feedback visible en cada acción (toasts con `sonner`).
- Loading states en cada botón que hace fetch.
- Empty states amigables ("Aún no hay pedidos esta semana").
- Confirmaciones explícitas para acciones destructivas.
- Atajos de teclado en admin (ej: `Cmd+K` para buscar cliente, `N` para nuevo pedido).

**Paleta sugerida:**

- Primario: el azul actual de Solola's (`#1A6BB8` o el oficial)
- Postres: morado `#8B5CF6`
- Salados: ámbar `#F59E0B`
- Éxito (pedido listo): verde `#10B981`
- Alerta: amarillo `#F59E0B`
- Error: rojo `#EF4444`
- Neutro: grises Tailwind

---

## 8. Integraciones

### 8.1 Correo (Resend)

Plantillas necesarias (React Email):

1. **Recibo de pago de curso** (con PDF adjunto)
2. **Recibo de pago de pedido** (con PDF adjunto)
3. **Confirmación de pedido creado** (al cliente)
4. **Pedido listo para entrega** (al admin)
5. **Recordatorio de pago pendiente** (a cliente con atraso)
6. **Recordatorio de clase próxima** (a estudiante, opcional)

### 8.2 e-NCF DGII (futuro)

El sistema actual maneja secuencias internas. La DGII (RD) está empujando hacia **e-CF (Comprobantes Fiscales Electrónicos)** con firma digital. No es bloqueante para v1, pero el schema debe estar preparado para:

- Almacenar XML del e-CF
- Estado de envío a DGII
- Track ID

### 8.3 WhatsApp (futuro)

Considerar **WhatsApp Cloud API** para:

- Notificar al cliente que su pedido está listo.
- Recordatorios de pago.
- Recibos por WhatsApp además de correo.

No bloqueante para v1.

---

## 9. Plan de implementación por fases

### Fase 0 — Setup (1 semana)

1. Inicializar repo con Next.js 15 + TS + Tailwind + shadcn.
2. Configurar Supabase (proyecto, schema base, RLS).
3. Configurar Drizzle, primeras migraciones.
4. Setup de auth con Supabase.
5. Layout base de admin.
6. CI/CD a Vercel.

### Fase 1 — Núcleo de pedidos (2-3 semanas)

1. CRUD de personas (clientes/estudiantes unificado).
2. CRUD de productos con categorías Dulces/Salados.
3. CRUD de productos: imágenes, ITBIS, etc.
4. Tomar pedido completo (3 tabs).
5. Referencias con upload de imágenes.
6. Facturación con generación de e-NCF.
7. Recibo PDF con logo (template nuevo).
8. Envío de correo con Resend.

### Fase 2 — Cocina y pizarras (2 semanas)

1. Vista `/cocina` con realtime.
2. Filtros por área y validaciones cruzadas.
3. PWA install + modo kiosko.
4. Pizarra General con FullCalendar.
5. Pizarras de área.
6. Detalle de pedido modal con edición sin perder referencias.
7. Notificación al admin cuando pedido está listo.

### Fase 3 — Clases (2 semanas)

1. CRUD de cursos.
2. Habilitar curso (sesiones).
3. Inscribir estudiantes con búsqueda inteligente.
4. Pago de inscripciones con e-NCF.
5. Recibo PDF para cursos.
6. Filtros visuales (verde/amarillo/rojo).

### Fase 4 — Reportes y dashboard (1-2 semanas)

1. Dashboard admin con métricas mejoradas.
2. Historial de pagos consolidado con filtros y exportación.
3. Historial de pedidos.
4. Resumen de producción.
5. Cursos vendidos.
6. Clientes con atraso + recordatorios.

### Fase 5 — Configuración y refinamiento (1 semana)

1. Página de configuración del negocio (logo, RNC, dirección).
2. Métodos de pago, tipos de comprobantes, NCF.
3. Gestión de usuarios del sistema y roles.
4. Plantillas de correo editables.
5. Backup automático.

### Fase 6 — Migración y go-live (1 semana)

1. Script de migración de datos del sistema actual.
2. Pruebas con datos reales en staging.
3. Capacitación a Raizel y empleados.
4. Go-live con periodo de coexistencia.

**Tiempo total estimado:** 9-11 semanas para v1 completa.

---

## 10. Migración de datos

El sistema actual está en `cursos.cibaocustom.com`. Para migrar:

1. **Exportar** desde el sistema actual:

- Tabla de clientes/estudiantes (Excel desde el listado).
- Tabla de productos.
- Cursos creados (desde la base si hay acceso, o reingresar manualmente — solo son ~388).
- Historial de pagos (exportable a Excel).
- Pedidos activos (los pendientes y los del último mes).

2. **Scripts de importación** (TypeScript):

- `scripts/import-people.ts` — clientes y estudiantes con detección de duplicados por correo/cédula y unificación.
- `scripts/import-products.ts` — productos con asignación de categoría (Dulces/Salados) según patrones del nombre.
- `scripts/import-payments.ts` — historial de pagos (manteniendo NCF originales).

3. **Validación post-migración:**

- Total de personas migradas.
- Total de pagos con suma cuadrada vs sistema anterior.
- Pedidos activos visibles en pizarra.

4. **Coexistencia:**

- El sistema actual queda en modo lectura por 1 mes para consultas.
- El nuevo sistema toma todos los nuevos pedidos e inscripciones.

---

## 11. Consideraciones especiales (RD)

- **Cumplimiento DGII:** RNC, NCF, ITBIS calculado correctamente, tipos de comprobante.
- **Idioma:** todo en español de RD.
- **Husos horarios:** RD usa AST (UTC-4) sin horario de verano. Configurar en Postgres y en Next.
- **Días festivos:** considerar en pizarra (los empleados no trabajan ciertos días).
- **Validación de cédula RD:** algoritmo Luhn modificado para cédulas dominicanas (11 dígitos).
- **Validación de RNC:** 9 dígitos con dígito verificador.
- **Formato telefónico:** `(809)`, `(829)`, `(849)` + 7 dígitos.

---

## 12. Testing

- **Unit tests** (Vitest) para lógica fiscal: cálculo de ITBIS, secuencias NCF, validación de cédula/RNC.
- **Integration tests** (Playwright) para los flujos críticos:
  - Crear cliente nuevo → tomar pedido → facturar → verificar correo.
  - Crear curso → inscribir estudiante → registrar pagos parciales → verificar color amarillo → completar pago → verificar verde.
  - Crear pedido con productos de ambas áreas → marcar items en cocina postres → intentar marcar pedido listo (debe bloquear) → marcar items salados → verificar pedido listo y notificación.
- **E2E manual** con Raizel antes de go-live.

---

## 13. Observabilidad

- **Sentry** para error tracking.
- **Logs estructurados** en Vercel.
- **Auditoría:** tabla `audit_log` con quién hizo qué cuándo (creación de pedidos, modificaciones, pagos, eliminaciones). Imprescindible para temas fiscales.

---

## 14. Pendientes y decisiones a confirmar antes de empezar

Marcar con Raizel:

1. **Logo oficial** y paleta de colores exacta de Solola's.
2. **¿Mantener subcategorías** (Picaderas, Postres, Galletas, etc.) como tags además de la categoría base?
3. **Dirección exacta del negocio**, RNC, datos de contacto que van en el recibo.
4. **¿Cuántos empleados de cocina hay** y cuántas tablets?
5. **¿Se quiere portal de cliente** (que el cliente pueda ver sus pedidos pasados, pagar online)? — Probablemente fase 7+.
6. **¿Integración con pasarela de pago** (Stripe, Azul, Cardnet)? — Fase 7+.
7. **¿WhatsApp** como canal de notificación? — Decidir antes de fase 2.
8. **Límite de almacenamiento** para fotos de referencias (¿cuántas por pedido?).
9. **Política de retención** de datos (¿cuánto tiempo se guarda historial completo?).

---

## 15. Cómo usar este documento con Claude Code

Pasos sugeridos para Eddy:

1. **Crear el repo** localmente: `npx create-next-app@latest sololas-v3 --typescript --tailwind --app`.
2. **Iniciar Claude Code** en la raíz del repo.
3. **Pegar primero la sección 2 (Stack), 3 (Arquitectura) y 4 (Modelo de datos)** para que Claude Code entienda el contexto y monte el setup base.
4. **Iterar por fases** (sección 9). Cada fase puede ser una sesión con Claude Code, pasando solo las secciones relevantes.
5. **Para cada feature**, pasar la sección 5 correspondiente como spec detallada.
6. **Mantener un `CLAUDE.md`** en la raíz del repo con resumen de decisiones y convenciones del proyecto, que Claude Code leerá automáticamente.
7. **Hacer commits frecuentes** y revisar diffs antes de cada PR a main.

**Prompt sugerido para arrancar con Claude Code:**

> Estoy construyendo Solola's v3, un sistema de gestión para repostería + taller culinario en RD. Lee el archivo `PLAN-SOLOLAS.md` completo. Vamos a ejecutar la Fase 0 (Setup). Configura el proyecto con el stack de la sección 2, monta el schema de la sección 4 con Drizzle, y crea las migraciones iniciales. No avances a otras fases hasta que confirme.

---

**Fin del plan.**

_Documento vivo. Iterar conforme se descubran nuevos requerimientos durante el desarrollo._
