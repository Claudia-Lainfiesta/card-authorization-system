import {
    NgModule
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    ClienteRoutingModule
} from './cliente-routing.module';

import {
    ClienteDashboardComponent
} from './cliente-dashboard/cliente-dashboard.component';

import {
    MisTarjetasComponent
} from './mis-tarjetas/mis-tarjetas.component';

import {
    MiHistorialComponent
} from './mi-historial/mi-historial.component';

import {
    SharedModule
} from '../shared/shared.module';

@NgModule({

    declarations: [

        ClienteDashboardComponent,

        MisTarjetasComponent,

        MiHistorialComponent

    ],

    imports: [

        CommonModule,

        ClienteRoutingModule,

        SharedModule

    ]

})
export class ClienteModule {
}