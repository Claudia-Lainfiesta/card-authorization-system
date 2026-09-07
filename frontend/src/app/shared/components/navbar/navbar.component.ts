import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styles: [
    `
      :host {
        display: block;
      }
      .mercury-nav > a.mercury-brand {
        font-size: 11px;
        font-weight: 600;
      }
    `,
  ],
})
export class NavbarComponent implements OnInit {
  private auth = inject(AuthService);
  private destroy = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  usuario: Usuario | null = this.auth.obtenerUsuario();
  perfilAbierto = false;
  cargando = false;
  error = '';
  get admin(): boolean {
    return this.usuario?.rol === 'ADMINISTRADOR';
  }
  get inicio(): string {
    return this.admin ? '/admin' : '/dashboard';
  }
  get iniciales(): string {
    return (this.usuario?.nombre_completo || 'Usuario')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }
  ngOnInit(): void {
    this.cargarPerfil();
  }
  abrirPerfil(): void {
    this.perfilAbierto = true;
    this.cargarPerfil();
  }
  cargarPerfil(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';
    this.auth
      .perfil()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.usuario = r.usuario;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'No fue posible actualizar los datos de tu cuenta';
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }
}
