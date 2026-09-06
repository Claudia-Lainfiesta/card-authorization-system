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
    RouterModule
} from '@angular/router';


import {
    LoginComponent
} from './login/login.component';

import {
    RegistroComponent
} from './registro/registro.component';


@NgModule({

    declarations: [

        LoginComponent,

        RegistroComponent

    ],

    imports: [

        CommonModule,

        ReactiveFormsModule,

        RouterModule

    ],

    exports: [

        LoginComponent,

        RegistroComponent

    ]

})
export class AuthModule {}