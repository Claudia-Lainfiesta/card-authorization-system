import { NgModule } from '@angular/core';
import { GestionPagosComponent } from './gestion-pagos/gestion-pagos.component';

import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

import { GestionTarjetasComponent } from './gestion-tarjetas/gestion-tarjetas.component';

import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';

import { SharedModule } from '../shared/shared.module';

import {
  AdminModalComponent,
  AdminPaginacionComponent,
  AdminMensajeComponent,
  AdminErrorCampoComponent,
  AdminIconoComponent,
} from './components/admin-controls';

@NgModule({
  declarations: [AdminDashboardComponent, GestionTarjetasComponent, GestionUsuariosComponent, GestionPagosComponent],

  imports: [
    CommonModule,
    AdminModalComponent,
    AdminPaginacionComponent,
    AdminMensajeComponent,
    AdminErrorCampoComponent,
    AdminIconoComponent,

    ReactiveFormsModule,

    AdminRoutingModule,

    SharedModule,
  ],
})
export class AdminModule {}
