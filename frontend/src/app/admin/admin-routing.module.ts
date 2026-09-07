import { NgModule } from '@angular/core';
import { GestionPagosComponent } from './gestion-pagos/gestion-pagos.component';

import { RouterModule, Routes } from '@angular/router';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

import { GestionTarjetasComponent } from './gestion-tarjetas/gestion-tarjetas.component';

import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';

const routes: Routes = [
  { path: 'pagos', component: GestionPagosComponent },
  { path: 'bitacora', component: AdminDashboardComponent, data: { bitacora: true } },

  {
    path: '',
    component: AdminDashboardComponent,
  },

  {
    path: 'tarjetas',
    component: GestionTarjetasComponent,
  },

  {
    path: 'usuarios',
    component: GestionUsuariosComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],

  exports: [RouterModule],
})
export class AdminRoutingModule {}
