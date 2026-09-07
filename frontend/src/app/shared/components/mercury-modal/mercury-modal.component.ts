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

@Component({
  selector: 'app-mercury-modal',
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
          <h2 class="text-xl font-medium text-white" id="titulo-modal-mercury">{{ titulo }}</h2>
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
export class MercuryModalComponent implements AfterViewInit, OnDestroy {
  @Input() titulo = '';
  @Input() ocupado = false;
  @Output() cerrar = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  private document = inject(DOCUMENT);
  private anterior: HTMLElement | null = null;
  ngAfterViewInit(): void {
    this.anterior = this.document.activeElement as HTMLElement | null;
    this.dialog.nativeElement.setAttribute('aria-labelledby', 'titulo-modal-mercury');
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
