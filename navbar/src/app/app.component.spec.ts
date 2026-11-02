import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const emitir = (detail: { total: number; activas: number }) =>
    window.dispatchEvent(new CustomEvent('postulaciones:cambio', { detail }));

  // Karma corre en la misma página que su runner: <html> y localStorage se restauran tras cada test
  let temaOriginal: string | null;
  let guardadoOriginal: string | null;
  const html = document.documentElement;

  const crear = () => {
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  };
  const botonTema = (nombre: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((b) => b.textContent?.includes(nombre));

  beforeEach(async () => {
    temaOriginal = html.getAttribute('data-theme');
    guardadoOriginal = localStorage.getItem('tema');
    html.setAttribute('data-theme', 'light');
    localStorage.removeItem('tema');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
    crear();
  });

  afterEach(() => {
    if (temaOriginal === null) html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', temaOriginal);
    if (guardadoOriginal === null) localStorage.removeItem('tema');
    else localStorage.setItem('tema', guardadoOriginal);
  });

  // Sin esta clase las utilidades con important: '.jt-navbar' no aplican
  it('el host tiene la clase raíz jt-navbar', () => {
    expect(fixture.nativeElement).toHaveClass('jt-navbar');
  });

  describe('botón de tema', () => {
    it('es un botón cuyo nombre dice la acción', () => {
      expect(botonTema('Activar tema oscuro')).toBeDefined();
    });

    it('al hacer clic pasa a oscuro, lo recuerda y cambia su nombre', () => {
      botonTema('Activar tema oscuro')!.click();
      fixture.detectChanges();
      expect(html.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('tema')).toBe('dark');
      expect(botonTema('Activar tema claro')).toBeDefined();
    });

    it('un segundo clic vuelve a claro', () => {
      botonTema('Activar tema oscuro')!.click();
      fixture.detectChanges();
      botonTema('Activar tema claro')!.click();
      fixture.detectChanges();
      expect(html.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('tema')).toBe('light');
    });

    it('lee el tema que ya tiene <html> al crearse', () => {
      html.setAttribute('data-theme', 'dark');
      crear();
      expect(botonTema('Activar tema claro')).toBeDefined();
    });

    it('con el almacenamiento bloqueado igual cambia el tema', () => {
      const guardar = spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado');
      botonTema('Activar tema oscuro')!.click();
      expect(html.getAttribute('data-theme')).toBe('dark');
      guardar.and.callThrough(); // afterEach puede necesitar setItem
    });

    it('sin data-theme o con un valor inválido usa claro', () => {
      for (const valor of [null, 'azul']) {
        if (valor === null) html.removeAttribute('data-theme');
        else html.setAttribute('data-theme', valor);
        crear();
        botonTema('Activar tema oscuro')!.click();
        expect(html.getAttribute('data-theme')).toBe('dark');
      }
    });
  });

  describe('navegación', () => {
    let urlOriginal: string;
    const enlace = (nombre: string) =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'))
        .find((a) => a.textContent?.trim() === nombre);
    const irA = (ruta: string) => {
      history.replaceState(history.state, '', ruta);
      window.dispatchEvent(new CustomEvent('single-spa:routing-event'));
      fixture.detectChanges();
    };

    beforeEach(() => {
      urlOriginal = location.pathname + location.search + location.hash;
    });
    afterEach(() => history.replaceState(history.state, '', urlOriginal));

    it('tiene los enlaces Inicio y Postulaciones con su href, y no Perfil', () => {
      expect(enlace('Inicio')?.getAttribute('href')).toBe('/');
      expect(enlace('Postulaciones')?.getAttribute('href')).toBe('/postulaciones');
      expect(texto()).not.toContain('Perfil');
    });

    it('marca Inicio con aria-current="page" en /', () => {
      irA('/');
      expect(enlace('Inicio')?.getAttribute('aria-current')).toBe('page');
      expect(enlace('Postulaciones')?.hasAttribute('aria-current')).toBeFalse();
    });

    it('marca Postulaciones con aria-current="page" en /postulaciones y al volver a / lo cambia', () => {
      irA('/postulaciones');
      expect(enlace('Postulaciones')?.getAttribute('aria-current')).toBe('page');
      expect(enlace('Inicio')?.hasAttribute('aria-current')).toBeFalse();
      irA('/');
      expect(enlace('Inicio')?.getAttribute('aria-current')).toBe('page');
      expect(enlace('Postulaciones')?.hasAttribute('aria-current')).toBeFalse();
    });

    it('un clic navega con single-spa sin recargar la página', () => {
      const clic = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      enlace('Postulaciones')!.dispatchEvent(clic);
      expect(clic.defaultPrevented).toBeTrue();
      expect(location.pathname).toBe('/postulaciones');
    });

    // Jasmine no tiene it.each: un it por caso
    const clicsDelNavegador: [string, MouseEventInit][] = [
      ['Ctrl+clic', { button: 0, ctrlKey: true }],
      ['Shift+clic', { button: 0, shiftKey: true }],
      ['Alt+clic', { button: 0, altKey: true }],
      ['Meta+clic', { button: 0, metaKey: true }],
      ['clic central', { button: 1 }],
    ];
    for (const [caso, init] of clicsDelNavegador) it(`con ${caso} deja que el navegador abra el enlace`, () => {
      const ruta = location.pathname;
      const clic = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
      enlace('Postulaciones')!.addEventListener('click', (e) => e.preventDefault(), { once: true }); // no salir de Karma
      const espia = spyOn(clic, 'preventDefault').and.callThrough();
      enlace('Postulaciones')!.dispatchEvent(clic);
      expect(espia).toHaveBeenCalledTimes(1); // solo el del test, no el del navbar
      expect(location.pathname).toBe(ruta);
    });

    // Sin preflight el navegador pinta los enlaces de azul/morado, ilegibles sobre --nav-bg.
    // :visited no se puede leer con getComputedStyle (privacidad), pero una clase de autor gana al a:visited del navegador
    it('los enlaces usan --nav-text, también el de la ruta actual', () => {
      html.style.setProperty('--nav-text', 'rgb(1, 2, 3)');
      try {
        irA('/postulaciones');
        for (const nombre of ['Inicio', 'Postulaciones']) {
          expect(getComputedStyle(enlace(nombre)!).color).toBe('rgb(1, 2, 3)');
        }
      } finally {
        html.style.removeProperty('--nav-text');
      }
    });

    it('al destruirse deja de escuchar el cambio de ruta', () => {
      const quitar = spyOn(window, 'removeEventListener').and.callThrough();
      fixture.destroy();
      expect(quitar).toHaveBeenCalledWith('single-spa:routing-event', jasmine.any(Function));
    });
  });

  it('al iniciar muestra "sin dato" y no "0 / 0"', () => {
    expect(texto()).toContain('—');
    expect(texto()).toContain('sin dato');
    expect(texto()).not.toContain('0 / 0');
  });

  it('muestra activas / total al recibir postulaciones:cambio', () => {
    emitir({ total: 5, activas: 3 });
    fixture.detectChanges();
    expect(texto()).toContain('3 / 5');
    expect(texto()).not.toContain('sin dato');
  });

  it('muestra "0 / 0" solo si llega un evento con 0', () => {
    emitir({ total: 0, activas: 0 });
    fixture.detectChanges();
    expect(texto()).toContain('0 / 0');
  });

  it('al destruirse deja de escuchar el evento', () => {
    const quitar = spyOn(window, 'removeEventListener').and.callThrough();
    fixture.destroy();
    expect(quitar).toHaveBeenCalledWith('postulaciones:cambio', jasmine.any(Function));
  });
});
