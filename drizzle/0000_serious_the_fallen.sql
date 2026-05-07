CREATE TYPE "public"."area_cocina" AS ENUM('postres', 'salados');--> statement-breakpoint
CREATE TYPE "public"."curso_estatus" AS ENUM('programado', 'en_curso', 'finalizado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."estatus_pago" AS ENUM('pendiente', 'parcial', 'pagado');--> statement-breakpoint
CREATE TYPE "public"."estatus_produccion" AS ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado');--> statement-breakpoint
CREATE SEQUENCE "public"."recibo_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1500 CACHE 1;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"area_cocina" text,
	"permisos" jsonb,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombres" text NOT NULL,
	"apellidos" text NOT NULL,
	"cedula_rnc" text,
	"telefono" text,
	"celular" text,
	"correo" text,
	"direccion" text,
	"is_cliente" boolean DEFAULT false NOT NULL,
	"is_estudiante" boolean DEFAULT false NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nombres" text NOT NULL,
	"apellidos" text NOT NULL,
	"rol_id" uuid NOT NULL,
	"area_cocina" "area_cocina",
	"tablet_id" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ncf_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ncf_type_id" uuid NOT NULL,
	"secuencia_actual" integer NOT NULL,
	"secuencia_inicial" integer NOT NULL,
	"secuencia_final" integer NOT NULL,
	"fecha_vencimiento" date,
	"cantidad_alerta_reorden" integer DEFAULT 50 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ncf_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"prefijo" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"requiere_referencia" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rellenos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_recibo" integer DEFAULT nextval('recibo_seq') NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"metodo_pago_id" uuid NOT NULL,
	"tipo_comprobante_id" uuid,
	"numero_comprobante" text,
	"numero_referencia" text,
	"concepto" text NOT NULL,
	"recibo_url" text,
	"registrado_por" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fin" time NOT NULL,
	"dias_semana" jsonb NOT NULL,
	"impartido_por" uuid,
	"limite_estudiantes" integer NOT NULL,
	"estatus" "curso_estatus" DEFAULT 'programado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"costo" numeric(12, 2) NOT NULL,
	"frecuencia" text,
	"duracion" text,
	"cantidad_pagos" integer DEFAULT 1 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_session_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"fecha_inscripcion" timestamp with time zone DEFAULT now() NOT NULL,
	"costo_acordado" numeric(12, 2) NOT NULL,
	"descuento" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estatus_pago" "estatus_pago" DEFAULT 'pendiente' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"cantidad" numeric(12, 2) NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"itbis_unitario" numeric(12, 2) DEFAULT '0' NOT NULL,
	"neto" numeric(12, 2) NOT NULL,
	"relleno_id" uuid,
	"topping" text,
	"decoracion" text,
	"notas" text,
	"listo" boolean DEFAULT false NOT NULL,
	"marcado_listo_por" uuid,
	"marcado_listo_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_recibo" integer DEFAULT nextval('recibo_seq') NOT NULL,
	"order_id" uuid NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"metodo_pago_id" uuid NOT NULL,
	"tipo_comprobante_id" uuid,
	"numero_comprobante" text,
	"numero_referencia" text,
	"recibo_url" text,
	"registrado_por" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"imagen_url" text NOT NULL,
	"nota" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer GENERATED ALWAYS AS IDENTITY (sequence name "orders_numero_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1500 CACHE 1),
	"person_id" uuid NOT NULL,
	"tema" text,
	"fecha_entrega" date NOT NULL,
	"hora_entrega" time,
	"delivery" boolean DEFAULT false NOT NULL,
	"direccion_delivery" text,
	"nota_general" text,
	"total_bruto" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_itbis" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_neto" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estatus_pago" "estatus_pago" DEFAULT 'pendiente' NOT NULL,
	"estatus_produccion" "estatus_produccion" DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"area_cocina" "area_cocina" NOT NULL,
	"color_hex" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"descripcion" text NOT NULL,
	"category_id" uuid NOT NULL,
	"subcategoria" text,
	"precio" numeric(12, 2) NOT NULL,
	"costo" numeric(12, 2),
	"itbis_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"unidad_medida" text DEFAULT 'unidad' NOT NULL,
	"cantidad_reorden" integer,
	"lleva_ingredientes" boolean DEFAULT false NOT NULL,
	"imagen_url" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singleton" text DEFAULT 'singleton' NOT NULL,
	"nombre_comercial" text NOT NULL,
	"razon_social" text,
	"rnc" text,
	"direccion" text,
	"telefono" text,
	"correo" text,
	"logo_url" text,
	"recibo_template" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_settings_singleton" CHECK ("business_settings"."singleton" = 'singleton')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"accion" text NOT NULL,
	"entidad" text NOT NULL,
	"entidad_id" uuid,
	"diff" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_users" ADD CONSTRAINT "system_users_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ncf_sequences" ADD CONSTRAINT "ncf_sequences_ncf_type_id_ncf_types_id_fk" FOREIGN KEY ("ncf_type_id") REFERENCES "public"."ncf_types"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_metodo_pago_id_payment_methods_id_fk" FOREIGN KEY ("metodo_pago_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_tipo_comprobante_id_ncf_types_id_fk" FOREIGN KEY ("tipo_comprobante_id") REFERENCES "public"."ncf_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_registrado_por_system_users_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_impartido_por_system_users_id_fk" FOREIGN KEY ("impartido_por") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_session_id_course_sessions_id_fk" FOREIGN KEY ("course_session_id") REFERENCES "public"."course_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_relleno_id_rellenos_id_fk" FOREIGN KEY ("relleno_id") REFERENCES "public"."rellenos"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_marcado_listo_por_system_users_id_fk" FOREIGN KEY ("marcado_listo_por") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_metodo_pago_id_payment_methods_id_fk" FOREIGN KEY ("metodo_pago_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_tipo_comprobante_id_ncf_types_id_fk" FOREIGN KEY ("tipo_comprobante_id") REFERENCES "public"."ncf_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_registrado_por_system_users_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_references" ADD CONSTRAINT "order_references_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_references" ADD CONSTRAINT "order_references_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_system_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_nombre_unique" ON "roles" USING btree ("nombre");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "people_cedula_rnc_unique" ON "people" USING btree ("cedula_rnc") WHERE "people"."cedula_rnc" is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_correo_idx" ON "people" USING btree ("correo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_is_cliente_idx" ON "people" USING btree ("is_cliente");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_is_estudiante_idx" ON "people" USING btree ("is_estudiante");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ncf_types_codigo_unique" ON "ncf_types" USING btree ("codigo");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rellenos_nombre_unique" ON "rellenos" USING btree ("nombre");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_categories_area_nombre_unique" ON "product_categories" USING btree ("area_cocina","nombre");