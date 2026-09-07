BEGIN;

ALTER TABLE tarjetas ADD COLUMN IF NOT EXISTS cvv_cifrado TEXT;
COMMENT ON COLUMN tarjetas.cvv_cifrado IS
    'CVV cifrado con AES-256-GCM; NULL en tarjetas históricas que solo conservan hash';

INSERT INTO emisores (id_emisor, nombre, bin_prefijo, activo)
VALUES ('MERCURY00000001', 'Mercury', '4', TRUE)
ON CONFLICT (id_emisor) DO UPDATE SET nombre = 'Mercury', bin_prefijo = '4', activo = TRUE;

UPDATE tarjetas SET id_emisor = 'MERCURY00000001'
WHERE id_emisor <> 'MERCURY00000001';
UPDATE emisores SET activo = FALSE WHERE id_emisor <> 'MERCURY00000001';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarjetas_emisor_mercury' AND conrelid = 'tarjetas'::regclass) THEN
        ALTER TABLE tarjetas ADD CONSTRAINT tarjetas_emisor_mercury CHECK (id_emisor = 'MERCURY00000001');
    END IF;
END $$;

COMMIT;
