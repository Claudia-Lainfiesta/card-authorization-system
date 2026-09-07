# Mercury: tarjetas, pagos y navegación

## Cambios de interfaz

- Mis tarjetas conserva la misma card y sus favoritas. El ojo muestra/oculta el número y el CVV, con carga y error por tarjeta. Ambas secciones comparten el estado. Los datos se descartan al ocultar la pestaña o destruir la vista; no se guardan en sessionStorage ni localStorage.
- Crear tarjeta genera el PAN en el servidor. El número es inmutable en edición. Emisor fijo Mercury. Los formularios aceptan `mm/yyyy`; la API normaliza a `yyyymm` y sigue aceptando el formato anterior.
- `/admin/pagos` busca por PAN (también con espacios/guiones), titular o nombre del propietario. Devuelve hasta 20 resultados enmascarados. Al registrar un pago, muestra disponible, deuda y comprobante con fecha/hora. La simulación reutiliza las transacciones PAGO; no llama a un banco.
- Navbar compartido por cliente y administrador, con marca enlazada a `/dashboard` (alias del inicio del cliente) o `/admin`. Incluye nombre, iniciales, rol y diálogo de perfil actualizado desde la API.
- Título Mercury y favicon `frontend/public/mercury.svg`, usado también en el navbar. No cambia el tema global.

## Endpoints

| Método y ruta | Acceso y comportamiento |
| --- | --- |
| `POST /api/v1/tarjetas` | Administrador. Genera 16 dígitos empezando por 4, con aleatoriedad criptográfica y dígito verificador. Comprueba existencia; el índice UNIQUE cubre concurrencia. Reintenta colisiones hasta 10 veces. No acepta PAN manual. |
| `PUT /api/v1/tarjetas/:id` | Administrador. Conserva PAN; permite actualizar CVV y vencimiento. CVV vacío debe omitirse para conservarlo. |
| `POST /api/v1/tarjetas/:id/revelar` | Nuevo. Solo CLIENTE propietario. Respuesta `{tarjeta:{id_tarjeta,numero_tarjeta,cvv}}`, sin caché. Ajena/inexistente: 404. Administrador: 403. |
| `POST /api/v1/tarjetas/buscar` | Nuevo. Administrador; cuerpo `{busqueda}`, para no poner el número en la URL. Respuesta enmascarada y sin caché. |
| `POST /api/v1/transacciones` | Existente, reutilizado. Administrador; cuerpo `{id_tarjeta,tipo:"PAGO",monto,comercio:"Pago recibido"}`. Bloquea la tarjeta y actualiza saldo + movimiento atómicamente. |
| `GET /api/v1/auth/me` | Nuevo. Perfil del usuario autenticado: nombre, correo, rol, estado. |
| `GET /api/v1/emisores` | Devuelve únicamente Mercury. |

El pago exige monto positivo con hasta dos decimales y no puede superar la deuda.
Las tarjetas canceladas no admiten pagos, conforme a la regla existente.
Los listados y respuestas administrativas habituales continúan enmascarados.

## Base y configuración

Aplicar [migración 002](../backend/migrations/002_mercury_datos_tarjeta.sql) después
de 001; instrucciones en [migrations/README.md](../backend/migrations/README.md).
Agrega `cvv_cifrado`, configura Mercury y reasigna las tarjetas existentes a ese
emisor. Conserva los demás registros de emisor inactivos y los números existentes.
No renumera tarjetas anteriores ni cambia sus códigos de seguridad.

Se requiere `CARD_DATA_KEY` (32 bytes aleatorios, codificados como 64 caracteres
hexadecimales) en el entorno del backend. El CVV nuevo/actualizado se guarda con
AES-256-GCM, IV aleatorio y vinculado al PAN, además del hash bcrypt que sigue
usando la autorización existente. La clave nunca se envía al frontend.

**Tarjetas anteriores:** un hash bcrypt no permite recuperar el CVV. Hasta que el
administrador actualice ese CVV, revelar devuelve `cvv:null`; la interfaz lo explica
y permite mostrar el PAN. No se inventa ni se modifica un CVV automáticamente.

## Archivos principales

- Cliente: `cliente/mis-tarjetas/mis-tarjetas.component.ts` y `.html`.
- Administración: `admin/gestion-tarjetas/*`, nuevo `admin/gestion-pagos/*`, módulo y rutas.
- Compartidos: `shared/components/navbar/*`, `shared/components/mercury-modal/*`,
  `shared.module.ts` y reemplazo de los navbars duplicados en los seis templates.
  El modal administrativo se reutiliza conservando estilos y comportamiento.
- Contratos y servicios: modelos tarjeta/transacción; servicios tarjetas,
  transacciones y auth; `app-routing.module.ts`, `index.html` y logo SVG.
- Backend: capas de tarjetas, perfil auth, consulta emisores, validación y cálculo
  de transacciones, `config/mercury.js`, `utils/cardData.js`, migración y `.env.example`.

## Verificación

Desde `frontend`:

```powershell
npm.cmd run build
node --test tests/admin-workflows.test.cjs
```

Desde `backend`:

```powershell
node --test tests/mercury-card-data.test.js tests/tarjetas-favoritas.test.js
$env:RUN_DB_TESTS = '1'
node --test tests/admin-crud.integration.test.js
```

La integración usa tablas PostgreSQL temporales aisladas. Verifica fechas, emisor,
permisos, ocultamiento de datos, CVV histórico, búsqueda y pagos con centavos.
Las pruebas unitarias cubren cifrado, alteración del contenido y reintentos por
colisión. Las pruebas Angular/RxJS comprueban visibilidad, respuestas tardías,
búsquedas, bloqueo de doble envío y recuperación ante errores.
