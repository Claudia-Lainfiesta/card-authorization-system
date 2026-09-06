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


@NgModule({

    declarations: [

        AccesoDenegadoComponent,

        LogoutButtonComponent

    ],

    imports: [

        CommonModule,

        RouterModule

    ],

    exports: [

        AccesoDenegadoComponent,

        LogoutButtonComponent

    ]

})
export class SharedModule {
}