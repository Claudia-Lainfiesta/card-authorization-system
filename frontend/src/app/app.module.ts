import {
  NgModule
} from '@angular/core';

import {
  BrowserModule
} from '@angular/platform-browser';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';


import {
  AppRoutingModule
} from './app-routing.module';

import {
  AppComponent
} from './app.component';

import {
  AuthModule
} from './auth/auth.module';

import {
  SharedModule
} from './shared/shared.module';


import {
  jwtInterceptor
} from './core/interceptors/jwt.interceptor';

import {
  errorInterceptor
} from './core/interceptors/error.interceptor';


@NgModule({

  declarations: [
    AppComponent
  ],

  imports: [

    BrowserModule,

    AuthModule,

    SharedModule,

    AppRoutingModule

  ],

  providers: [

    provideHttpClient(

      withFetch(),

      withInterceptors([
        jwtInterceptor,
        errorInterceptor
      ])

    )

  ],

  bootstrap: [
    AppComponent
  ]

})
export class AppModule {
}