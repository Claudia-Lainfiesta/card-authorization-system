const express =
    require('express');

const cors =
    require('cors');

const helmet =
    require('helmet');

const cookieParser =
    require('cookie-parser');


const authRoutes =
    require('./modules/auth/auth.routes');


const errorMiddleware =
    require('./middlewares/error.middleware');

const usuariosRoutes =
    require('./modules/usuarios/usuarios.routes');

const tarjetasRoutes =
    require('./modules/tarjetas/tarjetas.routes');

const transaccionesRoutes =
    require('./modules/transacciones/transacciones.routes');

const autorizacionesRoutes =
    require(
        './modules/autorizaciones/autorizaciones.routes'
    );

const app =
    express();


// Seguridad
app.use(
    helmet()
);


// CORS
app.use(
    cors({

        origin:
            'http://localhost:4200',

        credentials:
            true

    })
);


// Permitir JSON
app.use(
    express.json()
);


// Permitir cookies
app.use(
    cookieParser()
);


// ===============================
// RUTAS GENERALES
// ===============================

app.get(
    '/',
    (req, res) => {

        res.json({

            nombre:
                'Sistema de Gestión y Autorización de Tarjetas',

            status:
                'OK'

        });

    }
);


// ===============================
// API INTERNA
// ===============================

app.get(
    '/api/v1/status',
    (req, res) => {

        res.json({

            api:
                'API interna',

            version:
                'v1',

            status:
                'ONLINE'

        });

    }
);


// Auth
app.use(
    '/api/v1/auth',
    authRoutes
);

// Usuarios
app.use(
    '/api/v1/usuarios',
    usuariosRoutes
);

// Tarjetas
app.use(
    '/api/v1/tarjetas',
    tarjetasRoutes
);

// Transacciones
app.use(
    '/api/v1/transacciones',
    transaccionesRoutes
);

// Autorizaciones
app.use(
    '/ws/v1',
    autorizacionesRoutes
);


// ===============================
// WEB SERVICE
// ===============================

app.get(
    '/ws/v1/status',
    (req, res) => {

        res.json({

            servicio:
                'Web Service de autorización',

            version:
                'v1',

            status:
                'ONLINE'

        });

    }
);


// ===============================
// MANEJO DE ERRORES
// ===============================

app.use(
    errorMiddleware
);


module.exports = app;