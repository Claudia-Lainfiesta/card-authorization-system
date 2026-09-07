# Migración de tarjetas favoritas

Aplicar `001_tarjetas_favorita.sql` sobre la base PostgreSQL configurada en
`backend/.env`, antes de iniciar esta versión del backend. Puede ejecutarse en
el editor SQL de esa base o con `psql` desde la raíz del repositorio:

```sh
psql -h <host> -p <puerto> -U <usuario> -d <base> -v ON_ERROR_STOP=1 -f backend/migrations/001_tarjetas_favorita.sql
```

No incluir la contraseña en el comando. La migración conserva las tarjetas y
agrega `favorita BOOLEAN NOT NULL DEFAULT FALSE`. Se puede volver a ejecutar.

`GET /api/v1/tarjetas/mias` incluye `favorita`. El nuevo endpoint
`PATCH /api/v1/tarjetas/:id/favorita` recibe `{ "favorita": true }` o
`{ "favorita": false }` y devuelve `tarjeta: { id_tarjeta, favorita }` junto con
un mensaje. Guarda el valor solicitado, por lo que repetir la misma petición
no invierte accidentalmente la preferencia.

Requiere autenticación y rol `CLIENTE`. La escritura comprueba el propietario
en la misma consulta SQL; una tarjeta ajena o inexistente devuelve 404. Los
administradores reciben 403 en este endpoint y sus respuestas habituales no
incluyen la preferencia. Los estados de tarjeta no restringen las favoritas.

Las pruebas de las capas del endpoint se ejecutan desde `backend` con
`node --test tests/tarjetas-favoritas.test.js`. Sustituyen la conexión de base
de datos y la verificación del token; no necesitan credenciales ni cambian datos.
