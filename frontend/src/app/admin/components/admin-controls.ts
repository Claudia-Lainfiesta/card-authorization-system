import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
export { MercuryModalComponent as AdminModalComponent } from '../../shared/components/mercury-modal/mercury-modal.component';

@Component({
  selector: 'app-admin-paginacion',
  imports: [CommonModule],
  template: `
    <div *ngIf="total > 0" class="mt-5 flex flex-wrap items-center justify-between gap-5">
      <p class="text-sm text-neutral-400" role="status">
        {{ total }} registros · Página {{ pagina }} de {{ paginas }}
      </p>
      <nav *ngIf="paginas > 1" class="flex gap-3" aria-label="Paginación">
        <button
          type="button"
          class="mercury-secondary px-4 py-2 disabled:opacity-50"
          [disabled]="ocupado || pagina <= 1"
          (click)="cambiar.emit(pagina - 1)"
        >
          Anterior
        </button>
        <button
          type="button"
          class="mercury-secondary px-4 py-2 disabled:opacity-50"
          [disabled]="ocupado || pagina >= paginas"
          (click)="cambiar.emit(pagina + 1)"
        >
          Siguiente
        </button>
      </nav>
    </div>
  `,
})
export class AdminPaginacionComponent {
  @Input() total = 0;
  @Input() pagina = 1;
  @Input() porPagina = 10;
  @Input() ocupado = false;
  @Output() cambiar = new EventEmitter<number>();
  get paginas(): number {
    return Math.max(1, Math.ceil(this.total / this.porPagina));
  }
}

@Component({
  selector: 'app-admin-mensaje',
  imports: [CommonModule],
  template: `
    <div
      *ngIf="error"
      role="alert"
      class="mb-5 rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-300"
    >
      {{ error }}
    </div>
    <div
      *ngIf="mensaje"
      role="status"
      class="mb-5 rounded-lg border border-emerald-800 bg-emerald-950 p-3 text-sm text-emerald-300"
    >
      {{ mensaje }}
    </div>
  `,
})
export class AdminMensajeComponent {
  @Input() error = '';
  @Input() mensaje = '';
}

@Component({
  selector: 'app-admin-error-campo',
  imports: [CommonModule],
  template: `<p
    *ngIf="control?.invalid && (control?.touched || control?.dirty)"
    class="mt-2 text-sm text-red-300"
    role="alert"
  >
    {{ mensaje }}
  </p>`,
})
export class AdminErrorCampoComponent {
  @Input() control: AbstractControl | null = null;
  @Input() mensaje = 'Revisa este campo.';
}

@Component({
  selector: 'app-admin-icono',
  template: `
    <svg
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path
        [attr.d]="
          tipo === 'editar'
            ? 'm16 3 5 5-12 12H4v-5L16 3Zm-2 2 5 5'
            : 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'
        "
      ></path>
    </svg>
  `,
})
export class AdminIconoComponent {
  @Input() tipo: 'editar' | 'eliminar' = 'editar';
}
