import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-admin-modal',
  imports: [CommonModule],
  template: `
    <dialog
      #dialog
      class="mercury-surface m-auto text-neutral-300"
      (cancel)="cancelar($event)"
      (click)="fondo($event)"
    >
      <div class="p-6">
        <header class="mb-5 flex items-center justify-between gap-5">
          <h2 class="text-xl font-medium text-white" id="titulo-modal-admin">{{ titulo }}</h2>
          <button
            type="button"
            class="mercury-secondary px-4 py-2 disabled:opacity-50"
            [disabled]="ocupado"
            (click)="cerrar.emit()"
            aria-label="Cerrar diálogo"
          >
            Cerrar
          </button>
        </header>
        <ng-content></ng-content>
      </div>
    </dialog>
  `,
  styles: [
    `
      dialog {
        width: min(42rem, calc(100% - 32px));
        max-height: 90svh;
        padding: 0;
        background-color: #171717;
      }
      dialog::backdrop {
        background: #000a;
        backdrop-filter: blur(4px);
      }
    `,
  ],
})
export class AdminModalComponent implements AfterViewInit, OnDestroy {
  @Input() titulo = '';
  @Input() ocupado = false;
  @Output() cerrar = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  private document = inject(DOCUMENT);
  private anterior: HTMLElement | null = null;
  ngAfterViewInit(): void {
    this.anterior = this.document.activeElement as HTMLElement | null;
    this.dialog.nativeElement.setAttribute('aria-labelledby', 'titulo-modal-admin');
    this.dialog.nativeElement.showModal?.();
  }
  cancelar(event: Event): void {
    event.preventDefault();
    if (!this.ocupado) this.cerrar.emit();
  }
  fondo(event: MouseEvent): void {
    if (event.target !== this.dialog.nativeElement || this.ocupado) return;
    const r = this.dialog.nativeElement.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      this.cerrar.emit();
  }
  ngOnDestroy(): void {
    this.dialog.nativeElement.close?.();
    this.anterior?.focus();
  }
}

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
