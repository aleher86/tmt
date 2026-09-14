-- Extensiones que necesita el buscador único.
--
-- `unaccent` es lo que hace que "gonzalez" encuentre a "González", y `pg_trgm` es lo que
-- da la similitud por trigramas cuando no hay match exacto ni por prefijo.
--
-- Van al schema `extensions`, que es donde Supabase las espera y que ya está en el
-- `search_path` de los roles del proyecto.

CREATE SCHEMA IF NOT EXISTS extensions;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
