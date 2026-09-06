import {
    NgModule
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    ReactiveFormsModule
} from '@angular/forms';

import {
    AdminRoutingModule
} from './admin-routing.module';

import {
    AdminDashboardComponent
} from './admin-dashboard/admin-dashboard.component';

import {
    GestionTarjetasComponent
} from './gestion-tarjetas/gestion-tarjetas.component';

import {
    GestionUsuariosComponent
} from './gestion-usuarios/gestion-usuarios.component';

import {
    SharedModule
} from '../shared/shared.module';

@NgModule({

    declarations: [

        AdminDashboardComponent,

        GestionTarjetasComponent,

        GestionUsuariosComponent

    ],

    imports: [

        CommonModule,

        ReactiveFormsModule,

        AdminRoutingModule,
        
        SharedModule

    ]

})
export class AdminModule {
}