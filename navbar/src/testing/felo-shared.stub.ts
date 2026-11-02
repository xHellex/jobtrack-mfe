// Solo para Karma: en producción @Felo/shared es un external del import map.
// Mismo comportamiento que shared/src/Felo-shared.ts (eventos de window).
type Eventos = { 'postulaciones:cambio': { total: number; activas: number } };

export function on<K extends keyof Eventos>(tipo: K, handler: (d: Eventos[K]) => void): () => void {
  const fn = (e: Event) => handler((e as CustomEvent<Eventos[K]>).detail);
  window.addEventListener(tipo, fn);
  return () => window.removeEventListener(tipo, fn);
}
