import {
    NgModule
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    RouterModule
} from '@angular/router';

import {
    AccesoDenegadoComponent
} from './components/acceso-denegado/acceso-denegado.component';

import {
    LogoutButtonComponent
} from './components/logout-button/logout-button.component';


import { NavbarComponent } from './components/navbar/navbar.component';
import { MercuryModalComponent } from './components/mercury-modal/mercury-modal.component';

@NgModule({

    declarations: [
        NavbarComponent,

        AccesoDenegadoComponent,

        LogoutButtonComponent

    ],

    imports: [
        MercuryModalComponent,

        CommonModule,

        RouterModule

    ],

    exports: [
        NavbarComponent,
        MercuryModalComponent,

        AccesoDenegadoComponent,

        LogoutButtonComponent

    ]

})
export class SharedModule {
}
