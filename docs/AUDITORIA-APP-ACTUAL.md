# Auditoría — App actual (`cursos.cibaocustom.com`)

> Inventario detallado de la interfaz actual extraído del PDF `NOTAS SOLOLAS APP.pdf` (21 páginas, capturas + notas de Raizel).
>
> Este documento es el **contrato mínimo** que la nueva app v3 debe cubrir. Cada PR de Fase 1+ tiene que releer la sección correspondiente y validar que no se pierde ninguna funcionalidad.
>
> Notación:
> - 📌 = funcionalidad confirmada en captura
> - ⚠️ = nota explícita de Raizel (mejora pedida)
> - ❓ = pendiente de aclarar antes de implementar

## Resumen ejecutivo

La app actual está dividida en **dos módulos principales** con sidebars distintos:

1. **CLASES** (`/Default.aspx`) — gestión de cursos, estudiantes, inscripciones, pagos, facturación.
2. **PEDIDOS** (`/Productos.aspx`, `/TomarPedido.aspx`, etc.) — gestión de productos, clientes, pedidos, pizarras de cocina, reportes.

El menú principal (post-login) es una pantalla con dos iconos grandes que llevan a uno u otro módulo.

**Versión visible:** Version 2.3.0 · © 2018-2026 Solola's

---

## 1. Pantallas comunes

### 1.1 Login (`/Login.aspx`)

📌 Layout:
- Fondo azul corporativo (color brand).
- Logo "Solola's" en blanco.
- Card central con avatar circular + 2 inputs (Usuario, Clave) + botón "Acceder" (azul).

⚠️ Nota: pantalla genérica, debe modernizarse manteniendo paleta de marca.

### 1.2 Menú principal (`/Menu.aspx`)

📌 Layout:
- Fondo azul.
- Dos iconos grandes circulares centrados:
  - **Clases** (gorro de graduación)
  - **Pedidos** (clipboard con check)

⚠️ Nota: "DIVISION ENTRE CLASES Y PEDIDOS". Cada usuario debe entrar al módulo según su rol. La nueva app puede unificar dashboards o seguir separados.

### 1.3 Topbar común

- Branding "Solola's" izquierda (azul claro).
- Hamburguesa para colapsar sidebar.
- Esquina derecha: avatar + "Brito, Raizel" (nombre + apellido del user logueado).

### 1.4 Footer común

- "Copyright © 2018-2026 Solola's. All rights reserved."
- Lado derecho: "Version 2.3.0".

---

## 2. Módulo CLASES

### 2.1 Sidebar exacto

```
🏠 MENU PRINCIPAL
⚙️ Opciones                      [▾]
   👤 Usuarios
   👥 Clientes
   ⚙️ Cursos                      [▾]
      ⚙️ Listado de Cursos
      ⚙️ Habilitar Curso / Taller
   📄 Comprobantes
   📄 Tipos de Comprobantes
   ⚙️ Métodos de Pago             [Hot]
📊 Reportes                       [▾]
   📑 Historial de Pagos          [Hot]
   💬 Clientes con atrasos
   🎓 Cursos / Talleres vendidos
```

Badge `[Hot]` = enlace destacado en color naranja.

### 2.2 Dashboard Clases (`/Default.aspx`)

📌 4 cards de métricas grandes en fila:

| Card | Color | Métrica visible |
|---|---|---|
| Cursos Totales | Turquesa (#1ABC9C aprox) | 388 + icono lupa/tag |
| Cursos con cupos disponibles | Verde | 306 + icono gráfico |
| Cursos con cupos agotados | Ámbar | 82 + icono usuarios |
| Estudiantes con atrasos | Rojo | 0 + icono campana |

Cada card tiene link "Ver más" en la base.

⚠️ Mejora v3: **deben ser funcionales desde el inicio** (arrancan en 0 y se actualizan con datos reales). Hacerlas clickeables que naveguen al detalle.

### 2.3 Usuarios (`/Usuarios.aspx`) — operadores del sistema

Breadcrumb: `Inicio > Opciones > Usuarios`

📌 **Form CRUD (izquierda):**

| Campo | Tipo |
|---|---|
| ID | numérico read-only (autoincrement) |
| Nombres | text |
| Apellidos | text |
| Usuario | text (login) |
| Clave | password |
| Rol | select dropdown |

Botones: **Guardar** (cyan) | **Actualizar** (orange) | **Eliminar** (red) | **Cancelar** (gris).

📌 **Tabla (derecha):**

- Selector "Mostrando [10] registros" + Buscar.
- Columnas: `Seleccionar` (link azul) | ID | Usuario | Nombres | Apellidos | Rol
- Ejemplos visibles: `1 | carivera | Carlos | Rivera | Adm`, `2 | rbrito | Raizel | Brito | Adm`
- Paginación: "Mostrando del 1 al 2 de 2 registros" + Anterior/1/Siguiente.

❓ Aclarar: ¿la nueva app v3 mantiene tabla `system_users` separada de `auth.users` de Supabase? El plan sí lo prevé, pero falta aclarar si el campo "ID" se mantiene visible al usuario o solo el UUID interno.

### 2.4 Clientes (estudiantes en módulo Clases) (`/Clientes.aspx`)

📌 Layout:
- Form CRUD a la izquierda con campos vacíos (datos del estudiante).
- Tabla a la derecha con muchos registros (cientos visibles según notas).

⚠️ **Problema crítico**: "BASE DE DATOS DE ESTUDIANTES Y CLIENTES DE PEDIDOS... PARA CREAR ESTUDIANTES Y CLIENTES (DEBERIAN ESTAR DIVIDIDOS CON OPCION A PODER ANADIR ENTRE UNA BASE U OTRA SI ES CLIENTE Y ESTUDIANTE A LA MISMA VEZ)."

✅ Resuelto en plan v3: tabla `people` única con flags `is_cliente` / `is_estudiante`.

### 2.5 Listado de Cursos (`/ListadoCursos.aspx`)

📌 Form de creación de curso (izquierda) + tabla con todos los cursos creados (impartidos y no impartidos) a la derecha.

Campos del curso (según plan + captura):
- Nombre, Descripción, Costo, Frecuencia, Duración, Cantidad de Pagos, Activo.

### 2.6 Habilitar Curso / Taller (`/HabilitarCurso.aspx`)

📌 Form para crear "sesiones" del curso + tabla con todas las sesiones habilitadas a lo largo del tiempo.

Campos de la sesión:
- Curso (FK), Fecha inicio, Fecha fin, Hora inicio, Hora fin, Días de la semana, Impartido por (instructor), Límite de estudiantes, Estatus.

### 2.7 Inscripción de estudiantes (vista detalle de un curso habilitado)

📌 Form para registrar nuevo estudiante en el curso + tabla de estudiantes ya inscritos.

⚠️ **Filtro de color crítico**: "VERDE cuando está saldado al 100% y AMARILLO cuando hay abono o una parte paga." Plan v3 agrega ROJO para sin pagar.

### 2.8 Modal "Registrar Pago" (de inscripción)

📌 Campos:

| Campo | Tipo |
|---|---|
| Tipo de pago | select (Efectivo, Tarjeta, Transferencia, etc.) |
| Monto | numérico |
| Concepto | text (ej: '1ER PAGO', '2DO PAGO', 'ABONO') |
| Número de Referencia | text |
| Tipo de Comprobante | select (Crédito Fiscal, Factura de Consumo, Gubernamental, Notas de Crédito, Notas de Débito, Régimen Especial) |
| Comprobante (e-NCF) | autogenerado de la secuencia |

Botón: **Registrar Pago**.

⚠️ Comportamiento: "A CADA ESTUDIANTE LE DEBE DE LLEGAR UN CORREO CON SU RECIBO DE PAGO."

### 2.9 Recibo PDF (Clases) — formato actual

⚠️ **CRÍTICO MEJORAR**: "ESTE ES EL RECIBO QUE LE LLEGA A LOS ESTUDIANTES... NO ME GUSTA COMO SE VE... SE VE SIMPLE Y CON ERRORES. COLOCAR LOGO DE SOLOLAS."

Datos visibles en el recibo actual (extraídos del PDF en alta resolución):

```
Solola's
TALLER CULINARIO & CATERING
Av. República de Argentina #54, Rincón Largo,
Santiago, República Dominicana
Email: info@sololasrd.com,
Cel: (809) 879-2450, Tel: (809) 241-1575
─────────────────────────────────────
Fecha / Hora:    5/6/2026 2:32:00 AM
No. Pedido:      1500
Atendido por:    rbrito
Cliente:         Raquel Quezada
Rnc:
Contacto:        829-912-6762
Factura de Consumo
B0200005720
# Recibo:        1489
Forma Pago:      Orden de Crédito
# Transaccion:   1231
Nota:
Recibido:        $1.00
─────────────────────────────────────
Cant | Producto                              | Precio  | Neto
12   | Cupcakes Vainilla o Chocolate         | $125.00 | $1,500.00
     |   Sin Relleno                         |         |
     |   "Colocar topper impreso con la cara |         |
     |   del nino…"                          |         |
12   | Rice Crispy                           | $225.00 | $2,700.00
     |   "MASON MARCELO, 1 ANO…"             |         |
─────────────────────────────────────
                              Sub-total: $4,200.00
```

📌 **Datos del negocio confirmados** (van en `business_settings`):
- **Nombre comercial**: Solola's
- **Tagline**: TALLER CULINARIO & CATERING
- **Dirección**: Av. República de Argentina #54, Rincón Largo, Santiago, República Dominicana
- **Email**: info@sololasrd.com
- **Celular**: (809) 879-2450
- **Teléfono**: (809) 241-1575

❗ **Ojo**: el plan v3 (sección 5.4) tenía "(809) 247-9275" como Tel y eso es **incorrecto**. El valor real según el recibo más reciente es **(809) 241-1575**. Corregir.

📌 **Numeración**: `No. Pedido` y `# Recibo` son **secuencias distintas** (en el ejemplo: pedido 1500, recibo 1489).

### 2.10 Comprobantes (`/Comprobantes.aspx`)

📌 Tabla con miles de NCF (la captura muestra paginación de "1 a 10 de 10,000+").

⚠️ Nota: "NO LE DOY USO, PERO ES IMPORTANTE PARA EL REGISTRO Y REPORTE."

✅ Plan v3: agrupar por tipo y mostrar solo progreso/alertas, no la lista cruda.

### 2.11 Tipos de Comprobantes (`/TiposComprobantes.aspx`)

📌 Tabla simple con tipos de NCF (B01, B02, B14, B15, B04, B03, etc.).

⚠️ Nota: "TIPOS DE COMPROBANTES, TIENEN QUE VER CON LOS COMPROBANTES QUE SE VAN A EMITIR... TAMPOCO LE DOY USO PERO SON IMPORTANTE PARA LA CLASIFICACION DE LAS FACTURAS."

### 2.12 Métodos de Pago (`/MetodosPago.aspx`)

📌 Lista con métodos: Efectivo, Tarjeta de Crédito, Transferencia, Cheque, Orden de Crédito, Pedido a Crédito.

⚠️ Nota: "ESTO NO TENGO QUE VERLO COMO USUARIO, PUEDE ESTAR EN CONFIGURACION DE LA PAGINA."

✅ Plan v3: mover a `/admin/configuracion/metodos-pago`.

### 2.13 Historial de Pagos (`/HistPagos.aspx`)

📌 **Filtros (form arriba):**

| Filtro | Tipo |
|---|---|
| # Recibo | text |
| Cliente | text |
| Tipo de Comprobante | select |
| Comprobante | text |
| Forma de pago | select |
| Referencia | text |
| Concepto | text |
| Nombre del Curso | select |

Botones: **Buscar** | **Limpiar**.

📌 **Tabla:**

Columnas: Recibo | Fecha | Cliente | Usuario | Tipo de Comprobante | Forma pago | Referencia | Concepto | NCF | Total

📌 Search box arriba derecha de la tabla + paginación al pie.

📌 Botón **"Exportar"** (a Excel) en la esquina inferior izquierda.

📌 Footer con totales sumados (ej. "$41,750.00 ($340,400.00 total)").

⚠️ Mejora v3: agregar gráfico de ingresos por día/semana/mes arriba; export a PDF tipo "estado de cuenta"; vista resumen con totales por método de pago y por tipo de comprobante.

### 2.14 Clientes con atrasos (`/ClientesAtrasos.aspx`)

📌 Lista de clientes con balances pendientes.

⚠️ Mejora v3: agregar acción "Enviar recordatorio por correo" con plantilla.

### 2.15 Cursos / Talleres vendidos (`/CursosVendidos.aspx`)

📌 Reporte con cursos y total de inscripciones, ingresos generados.

⚠️ Mejora v3: agregar tasa de pagos completados vs pendientes.

---

## 3. Módulo PEDIDOS

### 3.1 Sidebar exacto

```
🏠 MENU PRINCIPAL
⚙️ Opciones                      [▾]
   🏛️ Mi Negocio
   ⚙️ Usuarios                    [▾]
      👥 Lista de Usuarios
      👤 Roles de Usuarios
   👥 Clientes
   👥 Suplidores
   ⚙️ Productos                   [▾]
      ⚙️ Lista de Productos
   ⚙️ Parametros                  [▾]
      ⚙️ Categoria Producto
      ⚙️ Rellenos
      ⚙️ Unidades de Medida
      ⚙️ Formas de Pago
📋 Acciones                       [▾]
   📦 Tomar Pedidos
   📅 Pizarra General
   📅 Pizarra Reposteria
   📅 Pizarra Salados
📊 Reportes                       [▾]
   📈 Historial de Pedidos
   📑 Historial de Pagos
```

❓ **Decisión pendiente** (anotada en CLAUDE.md):
1. ¿Se mantiene **Suplidores**? El plan v3 no lo contempla.
2. ¿**Roles de Usuarios** queda configurable o se mantiene como enum hardcoded?
3. ¿**Rellenos**, **Categoria Producto**, **Unidades de Medida**, **Formas de Pago** se mantienen como entidades CRUD o se simplifican (texto libre / enum)?
4. ¿**Mi Negocio** = `/admin/configuracion/negocio`?

### 3.2 Mi Negocio (`/MiNegocio.aspx`)

📌 Configuración del negocio (datos que aparecen en el recibo). Coincide con la tabla `business_settings` del plan.

### 3.3 Lista de Usuarios / Roles de Usuarios

📌 Igual al de CLASES pero específico para empleados de pedidos.

❓ ¿Es una tabla separada o es la misma `system_users` con filtro por rol?

### 3.4 Clientes (`/Clientes.aspx` — pedidos)

📌 La misma tabla que en CLASES (la nota crítica de Raizel pide unificarlas).

### 3.5 Suplidores (`/Suplidores.aspx`)

📌 CRUD de proveedores.

❓ Decidir si se mantiene en v3 o se pospone.

### 3.6 Lista de Productos (`/Productos.aspx`)

📌 Form de creación + tabla.

📌 **Form de Producto:**

| Campo | Tipo |
|---|---|
| ID | autoincrement |
| Descripción | text |
| Categoría | select (vinculado a área cocina) |
| Subcategoría | select / text |
| Unidad | select |
| Cantidad | numérico (cantidad de reorden) |
| Costo | numérico |
| Precio (s) | numérico |
| ITBIS | numérico (%) |
| Imagen | upload (drag & drop visible en captura, con preview) |
| Lleva ingredientes? | checkbox |

Botones: **Crear** (cyan) | **Guardar** (verde) | **Eliminar** (rojo) | **Cancelar** (gris).

⚠️ **Cambio crítico v3**: "SOLO PONER DOS CATEGORIAS (DULCES O SALADOS) Y QUE A PARTIR DE AQUI SE PUEDA VER EN LAS TABLETS DE LOS EMPLEADOS A LOS QUE CORRESPONDA ESE PRODUCTO."

⚠️ "PREFERIBLEMENTE QUE SE LES ENVIE UN MENSAJE DE QUE EL PEDIDO NO PUEDE SALIR INCOMPLETO SIN VERIFICAR LA OTRA AREA."

⚠️ "QUE SALGAN DE DISTINTOS COLORES PARA IDENTIFICAR CADA AREA. CADA AREA ESTA ASOCIADA A UN USUARIO DE EMPLEADOS YA QUE CADA EMPLEADO TIENE UNA TABLET ASOCIADA PERTENECIENTE A CADA AREA."

📌 **Confirmado por el usuario**: solo **2 tablets físicas** (una en Postres, otra en Picadera/Salados). Las pizarras son **3** (General solo admin + Postres + Salados).

### 3.7 Categoría Producto (`/CategoriaProducto.aspx`)

📌 CRUD simple.

❗ **Hallazgo crítico**: la app actual tiene **3 categorías visibles** en pizarras y reportes:
- **Bizcocho** (verde oscuro)
- **Postres** (tan/marrón claro)
- **Salados / Picadera** (rojo/burgundy)

Las pizarras tienen 3 tabs: `Bizcocho | Postres | Salados`.

❓ **Aclarar**: ¿`Bizcocho` es una categoría hermana o una **subcategoría** de Postres? Si solo hay 2 áreas de cocina, Bizcocho debería caer bajo `area_cocina = 'postres'`. Confirmar antes de Fase 1 para no romper el modelo del plan v3 (2 áreas × N subcategorías).

### 3.8 Rellenos (`/Rellenos.aspx`)

📌 CRUD simple. Sirve como dropdown al tomar pedido (campo `relleno` por item).

❓ ¿Mantenemos como entidad gestionable o lo dejamos como texto libre por item?

### 3.9 Unidades de Medida (`/UnidadesMedida.aspx`)

📌 CRUD simple (unidad, libra, docena, etc.).

### 3.10 Formas de Pago (`/FormasPago.aspx`)

📌 Misma data que "Métodos de Pago" del módulo Clases. **Probable duplicación** que en v3 se debe consolidar en una sola entidad.

### 3.11 Tomar Pedidos (`/TomarPedido.aspx`)

📌 **3 pestañas**: `Información General` | `Información del Pedido` | `Referencias`.

⚠️ Aclaración del usuario: "Se toman los pedidos en 2 tabs, no 3" — pero la captura claramente muestra 3 pestañas. Asumimos que `Referencias` está integrada visualmente con `Información del Pedido` o que se considera complementaria y no un paso separado. **Confirmar**: ¿unificamos Referencias dentro de "Información del Pedido" en la nueva UI?

#### 3.11.1 Tab "Información General"

| Campo | Tipo |
|---|---|
| Cliente | autocomplete (busca en clientes existentes; muestra "ID|Nombre" ej `2189|Raquel Quezada`) |
| Nombre | text (pre-llena al seleccionar cliente) |
| Apellido | text (pre-llena) |
| Rnc | text |
| Teléfono | text |
| Correo | text |
| Delivery? | checkbox (si está marcado, aparece campo "Dirección de delivery") |
| Nota (general del pedido) | textarea |
| Fecha de Entrega | date picker |
| Hora de Entrega | time picker (formato 12h, ej "12:30 PM") |

Botón: **Agregar Cliente** (cuando no se encuentra en autocomplete, abre form rápido).

📌 Filtro de búsqueda: "SE FILTRAN POR NOMBRE, TELEFONO O CORREO".

#### 3.11.2 Tab "Información del Pedido"

| Campo | Tipo |
|---|---|
| Tema | text (ej "Cumpleaños Mason Marcelo") |
| Tipo de Pedido | select (Postres / Salados / Mixto — calculado o manual) |
| Producto | autocomplete (busca en catálogo) |
| Cantidad | numérico |
| Precio | numérico (auto-llenado, editable) |
| ITBIS | numérico (auto desde producto) |
| Comentarios/Notas | textarea (por línea) |

📌 Tabla resumen abajo con líneas agregadas. Cada línea con icono eliminar.

📌 Totales: **Total Bruto** | **Total ITBIS** | **Total Neto** (calculados automáticamente).

Botón: **Agregar** (al pie).

#### 3.11.3 Tab "Referencias"

📌 Selector de producto (de los ya agregados al pedido) + upload de imagen + nota.

📌 Cuando se agrega, aparece en grid abajo con: Producto | Imagen (thumbnail) | Nota | Eliminar.

📌 Toast/feedback: "Referencia agregada al pedido" (visible en captura como toast verde).

Botón final: **Facturar** (azul cyan, flotante o al pie del módulo).

### 3.12 Modal "Facturar Pedido"

📌 Form de pago (idéntico al de Inscripciones de Cursos):

- Tipo de pago, Número de Factura, Tipo de Comprobante, Forma de Pago, Referencia, Concepto, Monto a Pagar, Monto Recibido, Cambio, Balance Pendiente.

⚠️ Comportamiento: "QUE LE LLEGUE EL RECIBO AL CLIENTE EN CASO DE QUE ESTE SU CORREO REGISTRADO."

### 3.13 Pizarra General (`/Pizarra.aspx?cocina=todo`)

📌 **3 tabs en el header del calendario**:
- `Bizcocho` | `Postres` | `Salados`

📌 Controles del calendario:
- `<` `today` `>` (navegación)
- Título del rango (ej "May, 2026")
- Selectores de vista: `Day` | `Week` | **`Month`** | `Timeline`

📌 Grid mensual con días de Mon a Sun.

📌 **Eventos**: cada uno con formato `{numero}-{categoria}-{cliente}` (ej `1495-Picadera-Noemi Almonte`).

📌 **Colores por estado**:
- **Verde oscuro** (#1A7E3F aprox): pedido completo / listo para entrega / entregado
- **Tan/marrón claro** (#D2B48C aprox): pedido de Postres en proceso
- **Rojo/burgundy** (#A0303C aprox): pedido de Salados/Picadera en proceso
- (Plan v3 además: gris para pendiente sin trabajo, tachado para entregado)

📌 Cuando hay muchos eventos por día, aparece "more..." con link.

⚠️ Mejora v3: drag & drop para reprogramar (solo admin), click para abrir modal de detalle.

### 3.14 Pizarra Repostería (`/Pizarra.aspx?cocina=postres`)

📌 Mismo layout que General pero filtrada solo a pedidos con items de postres.

⚠️ "SOLO LA VE LA PERSONA QUE TRABAJA EN ESTA AREA."

### 3.15 Pizarra Salados (`/Pizarra.aspx?cocina=salados`)

📌 Igual, filtrada a salados.

⚠️ "SOLO LE VE LOS QUE TRABAJAN EN ESA AREA."

📌 Ambas pizarras de área también muestran (translúcidos / read-only) los pedidos con items de la otra área para referencia cruzada — confirmar en próxima iteración del plan.

### 3.16 Modal "Detalle del pedido" (click en evento de pizarra)

📌 Header azul: "Detalle del pedido" con botón cerrar `[X]`.

📌 Datos del pedido (lista con bullets azules):
- Pedido: 1490
- Cliente: Noemi Almonte
- Fecha de Entrega: May 06, 2026 07:30:00
- Delivery?: Si
- Tema: Reunion
- Description: Enviar

📌 Separador.

📌 **Producto(s):** (header) — por cada item:
- Descripcion: (ej "Empanada de Pollo & Queso (Frita)")
- Cant.: 30
- Relleno: …
- Decoracion: …
- **Listo?**: `[checkbox]` ← lo marca cocina

📌 Footer con 3 botones:
- **Eliminar** (gris/blanco) — solo admin
- **Actualizar Pedido** (verde claro) — abre edición completa
- **Listo para Entrega** (verde oscuro) — solo se activa cuando todos los items tienen `Listo? = ✓`

⚠️ Comportamiento crítico: "EL CUAL UNA VEZ SE ACTUALIZA ME LLEGA UN CORREO INFORMANDO QUE EL PEDIDO ESTA LISTO PARA GESTIONAR EL PROCESO DE AVISAR AL CLIENTE EN CASO DE QUE REQUIERA O GESTIONAR TRANSPORTE. UNA VEZ LISTO EL PEDIDO, SE MARCA EN EL CALENDARIO CON COLOR VERDE."

⚠️ Comportamiento crítico (mejora v3): "SI LO MODIFICO, QUE NO SE PIERDAN LAS FOTOS O REFERENCIAS DE ESE PEDIDO CUANDO SE HAYA CARGADO ANTERIORMENTE."

### 3.17 Resumen de Producción (`/Pizarra.aspx?cocina=todo` — sección inferior)

📌 Tabla productos × días de la semana.

📌 Tabla actual muestra todos los productos del catálogo con cantidades requeridas por día (ej "Pan Sobao - Lunes: 0, Martes: 0, Miércoles: 5, Jueves: 0…").

⚠️ "RESUMEN DE PRODUCTOS QUE SE REQUIEREN PRODUCIR AL MES SEGUN LOS PEDIDOS REGISTRADOS HASTA EL MOMENTO."

⚠️ Mejora v3: selector de rango (semana/próxima/mes/personalizado), filtro por área, export Excel/PDF.

### 3.18 Historial de Pedidos (`/HistPedidos.aspx`)

Breadcrumb: `Inicio > Reportes > Historial de Pedidos`

📌 **Filtros (form arriba):**

| Campo | Tipo |
|---|---|
| # Pedido | text |
| Cliente | text |
| Tipo de Comprobante | select |
| Comprobante | text |
| Desde | date (formato YYYY-MM-DD) |
| Hasta | date |
| Usuario | text |

Botones: **Buscar** (cyan) | **Limpiar** (orange).

📌 **Tabla:**

| Columna | Notas |
|---|---|
| Ver Pedido | Icono de ojo azul (link al detalle/edición) |
| Factura | Número (ej "1474") |
| Fecha | Formato MM-DD-YYYY (ej "04-23-2026") |
| Cliente | Nombre |
| Pedido | Resumen tipo "Nota: (Bizcochos, Picadera)" |
| Comprobante | NCF (ej "B0200005640") |
| Usuario | Login (ej "rbrito") |
| Recibido | Monto pagado (ej "$0.00") |
| Total | Monto total (ej "$3,900.00") |
| Saldada | "NO" / "SI" |
| Estatus | Texto descriptivo (ej "PARA ENTREGA (2 DE 2)" / "PENDIENTE (0 DE 5)") |

📌 Search box arriba derecha + paginación al pie.

📌 Footer con totales: "Recibido: $1.00 ($1.00 total)" | "Total a Recibir: $9,269.00 ($9,269.00 total)".

⚠️ Mejora v3: acción "Hacer pago" (registrar abonos a pedidos pendientes), filtros adicionales (estatus de producción, área de cocina).

### 3.19 Historial de Pagos (módulo Pedidos) (`/HistPagosPed.aspx`)

📌 Misma estructura que Historial de Pagos de Clases pero filtrado solo a pagos de pedidos.

⚠️ Mejora v3: consolidar en una sola vista con toggle "Cursos | Pedidos | Ambos".

---

## 4. Notificaciones por correo (estado actual)

📌 La app actual ya envía:
1. Recibo de pago al cliente/estudiante (PDF adjunto).
2. Notificación al admin cuando un pedido se marca completo.
3. "Pedido creado satisfactoriamente" al crear un pedido (visible en captura de Gmail).

⚠️ Mejora v3: rediseñar templates con React Email, mejor branding, plantillas adicionales (recordatorios de pago, recordatorios de clase próxima).

---

## 5. Flujos extremo a extremo confirmados

### 5.1 Inscripción con pagos parciales

1. Buscar/crear estudiante en Clientes.
2. Habilitar curso (sesión).
3. Inscribir estudiante en la sesión.
4. Registrar pago parcial → genera recibo PDF + correo.
5. Estado de pago se refleja en color: amarillo (parcial) → verde (saldado).
6. Lista de "Clientes con atrasos" muestra los pendientes (rojo en plan v3).

### 5.2 Tomar pedido y producir

1. **Tomar Pedido**: cliente + items + referencias + facturar.
2. Pedido aparece en **Pizarra General** (color por área) y en pizarra del área correspondiente.
3. Cocina abre modal "Detalle del pedido" en su tablet, marca cada item con `Listo?`.
4. Cuando todos los items están listos, se habilita "Listo para Entrega".
5. Al marcar listo: pedido se vuelve verde en pizarra + correo al admin.
6. Admin gestiona entrega/transporte.
7. Cliente puede recibir aviso (manual o futuro WhatsApp).

### 5.3 Edición de pedido sin perder referencias

1. Desde Historial de Pedidos o Pizarra → click en "Ver Pedido".
2. Modal con detalle editable.
3. Cambiar campos generales o items NO debe borrar las imágenes de referencia ya cargadas (problema reportado en app actual).
4. Solo eliminar referencia explícitamente o eliminar el item asociado (con confirmación).

---

## 6. Pendientes de aclarar antes de Fase 1

1. ❓ **Bizcocho** como categoría: ¿hermana de Postres y Salados, o subcategoría de Postres? (Afecta el modelo `product_categories`).
2. ❓ **Suplidores**: ¿se mantiene el módulo o se pospone para v4?
3. ❓ **Roles configurables vs enum hardcoded**: ¿CRUD o se quedan los 5 fijos del plan?
4. ❓ **Rellenos**: ¿entidad CRUD o texto libre por item?
5. ❓ **Numeración**: confirmar que `No. Pedido` y `# Recibo` son secuencias separadas.
6. ❓ **Cédula en `system_users`**: ¿se agrega al schema?
7. ❓ **Tabs en Tomar Pedido**: ¿2 o 3? (la captura muestra 3, el usuario dice 2).
8. ❓ **Pizarras de área**: ¿muestran los pedidos de la otra área en read-only o solo los propios?

Una vez resueltos, se actualiza `PLAN-SOLOLAS.md` § 4 y § 5 con la decisión final.

---

## 7. Reglas para usar este documento

- **No iniciar Fase 1** sin antes resolver los pendientes de § 6.
- **Cada PR de Fase 1+** debe releer la sección del módulo que toca y validar contra esta auditoría.
- **Si una pantalla de la nueva app no replica algo aquí**, justificarlo en el PR (mejora deliberada o decidido eliminar) o cubrirlo.
- **Las capturas originales** viven en `NOTAS SOLOLAS APP.pdf` en la raíz del repo. Re-renderizar a PNG con `pdftoppm -png -r 250 "NOTAS SOLOLAS APP.pdf" /tmp/notas-hi/p` cuando se necesite revisar al pixel.
