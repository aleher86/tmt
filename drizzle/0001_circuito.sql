CREATE TABLE "circuito" (
	"id" integer PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"divisiones_hacia_arriba" integer NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "circuito_fila_unica" CHECK ("circuito"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "circuito" ENABLE ROW LEVEL SECURITY;