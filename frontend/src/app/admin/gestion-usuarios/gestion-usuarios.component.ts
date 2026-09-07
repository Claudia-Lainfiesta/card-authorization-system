import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario, RolUsuario } from '../../core/models/usuario.model';
import { errorApi, normalizar } from '../components/admin-utils';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: false,
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css',
})
export class GestionUsuariosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(UsuariosService);
  private cdr = inject(ChangeDetectorRef);
  private destroy = inject(DestroyRef);
  readonly usuarioActualId = inject(AuthService).obtenerUsuario()?.id_usuario;
  usuarios: Usuario[] = [];
  cargando = true;
  guardando = false;
  error = '';
  errorFormulario = '';
  mensaje = '';
  busqueda = '';
  rolFiltro = '';
  pagina = 1;
  readonly porPagina = 10;
  mostrandoFormulario = false;
  usuarioEditando: Usuario | null = null;
  usuarioEliminando: Usuario | null = null;
  formulario = this.fb.nonNullable.group({
    nombre_completo: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    ],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    rol: ['CLIENTE' as RolUsuario, Validators.required],
    activo: [true],
  });
  get filtrados(): Usuario[] {
    const texto = normalizar(this.busqueda);
    return this.usuarios.filter(
      (u) =>
        (!this.rolFiltro || u.rol === this.rolFiltro) &&
        (!texto ||
          normalizar(u.nombre_completo).includes(texto) ||
          normalizar(u.correo).includes(texto)),
    );
  }
  get visibles(): Usuario[] {
    return this.filtrados.slice((this.pagina - 1) * this.porPagina, this.pagina * this.porPagina);
  }
  filtrar(): void {
    this.pagina = 1;
  }
  ngOnInit(): void {
    this.cargarUsuarios();
  }
  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';
    this.service
      .listar()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.usuarios = r.usuarios;
          this.pagina = Math.min(
            this.pagina,
            Math.max(1, Math.ceil(this.filtrados.length / this.porPagina)),
          );
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.error = errorApi(e, 'No fue posible cargar los usuarios');
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }
  abrir(usuario: Usuario | null = null): void {
    this.usuarioEditando = usuario;
    this.errorFormulario = '';
    this.mensaje = '';
    this.formulario.enable();
    this.formulario.reset({
      nombre_completo: usuario?.nombre_completo || '',
      correo: usuario?.correo || '',
      password: '',
      rol: usuario?.rol || 'CLIENTE',
      activo: usuario?.activo ?? true,
    });
    if (usuario) this.formulario.controls.password.disable();
    if (usuario?.id_usuario === this.usuarioActualId) {
      this.formulario.controls.rol.disable();
      this.formulario.controls.activo.disable();
    }
    this.mostrandoFormulario = true;
  }
  cerrar(): void {
    if (this.guardando) return;
    this.mostrandoFormulario = false;
    this.usuarioEditando = null;
    this.usuarioEliminando = null;
    this.formulario.reset();
    this.errorFormulario = '';
  }
  guardar(): void {
    if (this.guardando) return;
    this.formulario.controls.nombre_completo.setValue(
      this.formulario.controls.nombre_completo.value.trim(),
    );
    this.formulario.controls.correo.setValue(
      this.formulario.controls.correo.value.trim().toLowerCase(),
    );
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const datos = this.formulario.getRawValue();
    const editando = this.usuarioEditando;
    if (
      editando?.id_usuario === this.usuarioActualId &&
      (datos.rol !== 'ADMINISTRADOR' || !datos.activo)
    ) {
      this.errorFormulario = 'No puedes desactivar tu cuenta ni quitarte el rol de Administrador';
      return;
    }
    const peticion = editando
      ? this.service.actualizar(editando.id_usuario, {
          nombre_completo: datos.nombre_completo,
          correo: datos.correo,
          rol: datos.rol,
          activo: datos.activo,
        })
      : this.service.crear({
          nombre_completo: datos.nombre_completo,
          correo: datos.correo,
          password: datos.password,
          rol: datos.rol,
        });
    this.guardando = true;
    this.errorFormulario = '';
    peticion
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (r) => {
          this.mostrandoFormulario = false;
          this.usuarioEditando = null;
          this.formulario.reset();
          this.mensaje = r.mensaje;
          this.cargarUsuarios();
        },
        error: (e) => {
          this.errorFormulario = errorApi(e, 'No fue posible guardar el usuario');
          if (this.errorFormulario.includes('correo'))
            this.formulario.controls.correo.setErrors({ duplicado: true });
          this.cdr.markForCheck();
        },
      });
  }
  confirmarEliminacion(usuario: Usuario): void {
    if (usuario.id_usuario === this.usuarioActualId) return;
    this.usuarioEliminando = usuario;
    this.errorFormulario = '';
    this.mensaje = '';
  }
  eliminar(): void {
    if (
      !this.usuarioEliminando ||
      this.guardando ||
      this.usuarioEliminando.id_usuario === this.usuarioActualId
    )
      return;
    this.guardando = true;
    this.errorFormulario = '';
    this.service
      .eliminar(this.usuarioEliminando.id_usuario)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (r) => {
          this.usuarioEliminando = null;
          this.mensaje = r.mensaje + '. Tarjetas canceladas: ' + r.tarjetas_canceladas;
          this.cargarUsuarios();
        },
        error: (e) => {
          this.errorFormulario = errorApi(e, 'No fue posible eliminar el usuario');
          this.cdr.markForCheck();
        },
      });
  }
}
