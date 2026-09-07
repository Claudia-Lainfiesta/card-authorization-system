# Panel de administración

El módulo conserva el tema Mercury. El cliente y los estilos globales no se
modifican. No requiere migraciones: usa las tablas y columnas existentes,
incluida la migración de favoritas que ya estaba aplicada.

## Interfaz y archivos

- `frontend/src/app/admin/admin-dashboard/admin-dashboard.component.ts` y `.html`:
  cuatro métricas del sistema, carga con skeleton, errores independientes y
  autorizaciones recientes. La ruta `/admin/bitacora` reutiliza la tabla para
  consultar toda la bitácora con paginación del servidor.
- `frontend/src/app/admin/gestion-tarjetas/gestion-tarjetas.component.ts` y `.html`:
  búsqueda por titular o últimos cuatro dígitos, filtro por estado, paginación,
  creación, edición y confirmación de cancelación.
- `frontend/src/app/admin/gestion-usuarios/gestion-usuarios.component.ts` y `.html`:
  búsqueda por nombre/correo, filtro por rol, paginación y CRUD.
- `frontend/src/app/admin/components/admin-controls.ts`: un solo componente de
  modal basado en `dialog` nativo, con foco contenido y restaurado, cierre con
  Escape y bloqueo al guardar; paginación, mensajes, errores inline e íconos
  compartidos por las vistas administrativas.
- `frontend/src/app/admin/components/admin-utils.ts`: búsqueda sin distinción
  de acentos y extracción de mensajes de error.
- `frontend/src/app/admin/admin.module.ts` y `admin-routing.module.ts`: controles
  compartidos y ruta de bitácora.
- `frontend/src/app/core/models/admin.model.ts`, `tarjeta.model.ts` y
  `usuario.model.ts`: contratos tipados.
- `frontend/src/app/core/services/reportes.service.ts` y `usuarios.service.ts`:
  consultas administrativas y CRUD de usuarios. Se reutiliza `TarjetasService`.

Las tablas usan `mercury-table` y las superficies, botones y badges existentes.
El proyecto no tenía un componente base de tabla, modal ni toast. Se mantiene
el patrón de mensajes en página mediante `AdminMensajeComponent`; no se agrega
una librería de notificaciones. La paginación reproduce los botones Anterior y
Siguiente del historial del cliente. Los formularios usan Reactive Forms y los
colores de error ya existentes.

## Endpoints

Todos requieren el rol actual `ADMINISTRADOR`.

| Endpoint | Implementación |
| --- | --- |
| `GET /api/v1/reportes/resumen` | Nuevo; tarjetas activas, usuarios registrados, autorizaciones de hoy y tasa de aprobación. Sin autorizaciones del día, la tasa es 0. |
| `GET /api/v1/autorizaciones/bitacora?limit=10&pagina=1` | Nuevo; total y página, ordenada por fecha, hora e ID descendentes; límite de 1 a 100. |
| `GET /api/v1/emisores` | Nuevo; catálogo para los selectores. |
| `GET /api/v1/tarjetas` | Existente; listado enmascarado. |
| `POST /api/v1/tarjetas` | Existente; validación reforzada de montos y propietario activo. |
| `PUT /api/v1/tarjetas/:id` | Ampliado; titular, número nuevo opcional, vencimiento, CVV nuevo opcional, emisor, propietario, límite y estado. |
| `DELETE /api/v1/tarjetas/:id` | Existente; cambia a CANCELADA y conserva el historial. |
| `GET /api/v1/usuarios` | Existente. |
| `POST /api/v1/usuarios` | Nuevo; nombre, correo, contraseña inicial y rol. |
| `PUT /api/v1/usuarios/:id` | Nuevo; nombre, correo, rol y activo. |
| `DELETE /api/v1/usuarios/:id` | Nuevo; desactiva al usuario y cancela sus tarjetas en una sola transacción. |
| `PUT /api/v1/usuarios/:id/rol` | Existente; ahora valida el cuerpo y protege el rol del administrador autenticado. |

Las métricas usan la misma fecha local del servidor que se usa para registrar
las autorizaciones. Tarjetas y usuarios se filtran y paginan localmente; la
bitácora se pagina en PostgreSQL.

Backend: se agregan las capas repository/service/controller/routes de
`reportes` y `emisores`, y `autorizaciones/bitacora.routes.js`; se amplían las
capas existentes de `autorizaciones`, `tarjetas` y `usuarios`, se agrega
`usuarios/usuarios.validation.js`, se registran rutas en `src/app.js` y se
comparte el manejo transaccional en `src/utils/transaction.js`.

## Reglas de datos y permisos

- La edición no recupera PAN ni CVV. Conservar el número enmascarado omite ese
  campo del PUT; dejar el CVV vacío conserva su hash. Las respuestas no exponen
  el PAN, el CVV ni hashes de contraseña.
- En creación, la interfaz inicializa el disponible con el monto autorizado.
  Al editar el límite, el backend bloquea la tarjeta y conserva el utilizado:
  `nuevo disponible = nuevo autorizado - utilizado actual`. Rechaza límites
  inferiores al utilizado y cambios manuales de disponible que lo alteren.
- Reasignar una tarjeta limpia la favorita del propietario anterior.
- La eliminación de usuarios es lógica: no borra registros ni deja tarjetas
  sin propietario. Reactivar una cuenta no reactiva sus tarjetas canceladas.
- El administrador no puede desactivarse, eliminarse ni degradar su propio rol.
  El middleware de autenticación consulta el rol y estado actuales en la base,
  por lo que los cambios también afectan tokens emitidos anteriormente.
- La contraseña inicial sigue las reglas del registro (8 a 100 caracteres).
  No se inventa un flujo de restablecimiento de contraseña: no existe uno en
  este repositorio.

## Verificación

Desde `frontend`:

```powershell
npm.cmd run build
node --test tests/admin-workflows.test.cjs
```

Desde `backend`:

```powershell
node --test tests/tarjetas-favoritas.test.js
$env:RUN_DB_TESTS = '1'
node --test tests/admin-crud.integration.test.js
```

La prueba de integración requiere la conexión de desarrollo local de `.env`.
Crea tablas y secuencias temporales aisladas; no modifica datos reales. Prueba
permisos, sesiones con rol antiguo, métricas del día, paginación, datos sensibles,
correo duplicado, límites, CVV opcional, cancelación y rollback de eliminación.
La prueba de favoritas se adapta a la consulta de usuario actual del middleware.
