import {
    NgModule
} from '@angular/core';

import {
    RouterModule,
    Routes
} from '@angular/router';


import {
    LoginComponent
} from './auth/login/login.component';

import {
    RegistroComponent
} from './auth/registro/registro.component';

import {
    AccesoDenegadoComponent
} from './shared/components/acceso-denegado/acceso-denegado.component';


import {
    authGuard
} from './core/guards/auth.guard';

import {
    roleGuard
} from './core/guards/role.guard';


const routes: Routes = [

    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },


    {
        path: 'login',
        component:
            LoginComponent
    },


    {
        path: 'registro',
        component:
            RegistroComponent
    },


    {
        path: 'acceso-denegado',
        component:
            AccesoDenegadoComponent
    },


    {
        path: 'admin',

        canActivate: [
            authGuard,
            roleGuard
        ],

        data: {
            rolesPermitidos: [
                'ADMINISTRADOR'
            ]
        },

        loadChildren:
            () =>
                import(
                    './admin/admin.module'
                )
                .then(
                    m =>
                        m.AdminModule
                )

    },


    {
        path: 'cliente',

        canActivate: [
            authGuard,
            roleGuard
        ],

        data: {
            rolesPermitidos: [
                'CLIENTE'
            ]
        },

        loadChildren:
            () =>
                import(
                    './cliente/cliente.module'
                )
                .then(
                    m =>
                        m.ClienteModule
                )

    },


    {
        path: '**',
        redirectTo: 'login'
    }

];


@NgModule({

    imports: [
        RouterModule.forRoot(
            routes
        )
    ],

    exports: [
        RouterModule
    ]

})
export class AppRoutingModule {}