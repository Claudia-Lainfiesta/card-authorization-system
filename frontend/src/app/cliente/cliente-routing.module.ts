import {
    NgModule
} from '@angular/core';

import {
    RouterModule,
    Routes
} from '@angular/router';

import {
    ClienteDashboardComponent
} from './cliente-dashboard/cliente-dashboard.component';

import {
    MisTarjetasComponent
} from './mis-tarjetas/mis-tarjetas.component';

import {
    MiHistorialComponent
} from './mi-historial/mi-historial.component';


const routes: Routes = [

    {
        path: '',
        component:
            ClienteDashboardComponent
    },

    {
        path: 'tarjetas',
        component:
            MisTarjetasComponent
    },

    {
        path: 'historial',
        component:
            MiHistorialComponent
    }

];


@NgModule({

    imports: [
        RouterModule.forChild(
            routes
        )
    ],

    exports: [
        RouterModule
    ]

})
export class ClienteRoutingModule {
}