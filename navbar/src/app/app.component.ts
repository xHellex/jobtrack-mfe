import { Component, OnInit, OnDestroy, NgZone, signal } from '@angular/core';

// @ts-ignore
import { on } from '@Felo/shared';
import { navigateToUrl } from 'single-spa';

type Contador =
  | { tipo: 'sin-dato' }
  | { tipo: 'datos'; total: number; activas: number };

type Tema = 'light' | 'dark';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  host: { class: 'jt-navbar' },
  template: `
    <div class="bg-nav-bg text-nav-text px-6 py-4 flex flex-wrap gap-y-2 items-center justify-between shadow-card z-50 relative">
      <p class="m-0 text-2xl tracking-wide font-bold">JOBTRACK <span class="text-accent">PRO</span></p>
      <div class="flex flex-wrap gap-x-4 gap-y-2 md:gap-x-8 items-center font-medium">
        <button type="button" (click)="toggleTema()"
          class="p-2 rounded opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-text">
          <span aria-hidden="true">🌓</span>
          <span class="sr-only">{{ tema() === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro' }}</span>
        </button>
        @for (e of enlaces; track e.href) {
          <a [href]="e.href" (click)="navegar($event, e.href)" [attr.aria-current]="activo(e.href) ? 'page' : null"
            class="p-1 rounded text-nav-text opacity-90 transition-opacity hover:opacity-100 aria-[current=page]:opacity-100 aria-[current=page]:underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-text">{{ e.texto }}</a>
        }
        <div class="bg-accent text-on-accent px-4 py-2 rounded-full font-extrabold ml-2 sm:ml-5">
          🔔 Activas:
          @if (contador(); as c) {
            @switch (c.tipo) {
              @case ('datos') { {{ c.activas }} / {{ c.total }} }
              @case ('sin-dato') { <span aria-hidden="true">—</span><span class="sr-only">sin dato</span> }
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class AppComponent implements OnInit, OnDestroy {
  // El navbar solo sabe lo que le llega por el evento: antes de eso no hay dato (no es 0)
  contador = signal<Contador>({ tipo: 'sin-dato' });
  // El script tema-inicial de root-config ya fijó data-theme; sin él (Karma, ng serve) se asume claro
  tema = signal<Tema>(document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light');
  enlaces = [
    { href: '/', texto: 'Inicio' },
    { href: '/postulaciones', texto: 'Postulaciones' },
  ];
  ruta = signal(location.pathname);
  private offListener?: () => void;
  // single-spa lo emite tras cada navegación, también con atrás/adelante
  private actualizarRuta = () => this.ngZone.run(() => this.ruta.set(location.pathname));

  constructor(private ngZone: NgZone) { }

  ngOnInit() {
    window.addEventListener('single-spa:routing-event', this.actualizarRuta);
    // Escuchar el bus global desde Angular
    this.offListener = on('postulaciones:cambio', (data: { total: number; activas: number }) => {
      // Zone.js es necesario porque @Felo/shared emite un CustomEvent fuera de la zona de Angular
      this.ngZone.run(() => {
        this.contador.set({ tipo: 'datos', total: data.total, activas: data.activas });
      });
    });
  }

  // Igual que <route path="postulaciones"> del layout: coincide por prefijo
  activo(href: string): boolean {
    const ruta = this.ruta();
    return href === '/' ? ruta === '/' : ruta === href || ruta.startsWith(href + '/');
  }

  // Ctrl/Shift/Alt/Meta o clic no principal: el navegador abre la pestaña o ventana como siempre
  navegar(evento: MouseEvent, href: string) {
    if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    navigateToUrl(href);
  }

  toggleTema() {
    const nuevo: Tema = this.tema() === 'dark' ? 'light' : 'dark';
    this.tema.set(nuevo);
    document.documentElement.dataset['theme'] = nuevo;
    try {
      localStorage.setItem('tema', nuevo);
    } catch {
      // Almacenamiento bloqueado: el tema cambia igual, solo no se recuerda
    }
  }

  ngOnDestroy() {
    window.removeEventListener('single-spa:routing-event', this.actualizarRuta);
    if (this.offListener) this.offListener();
  }
}
