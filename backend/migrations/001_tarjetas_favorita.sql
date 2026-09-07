-- Aplicar antes de iniciar el backend con soporte de favoritas.
-- Las tarjetas existentes y las nuevas empiezan sin marcar.
BEGIN;

ALTER TABLE tarjetas
    ADD COLUMN IF NOT EXISTS favorita BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN tarjetas.favorita IS
    'Preferencia visual editable solo por el cliente propietario mediante la API';

COMMIT;
