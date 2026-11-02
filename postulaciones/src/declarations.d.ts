declare module "*.html" {
  const rawHtmlFile: string;
  export = rawHtmlFile;
}

declare module "*.bmp" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

// Espejo manual de shared/src/Felo-shared.ts: mantener sincronizado
declare module '@Felo/shared' {
  export type EstadoPostulacion = 'postulado' | 'entrevista' | 'oferta' | 'rechazado';
  export interface Postulacion {
    id: string;
    empresa: string;
    cargo: string;
    estado: EstadoPostulacion;
    fecha: string;
  }
  export function filtrarPostulaciones(res: unknown, origen: string): Postulacion[];
  type Eventos = { 'postulaciones:cambio': { total: number; activas: number } };
  export function emit<K extends keyof Eventos>(tipo: K, d: Eventos[K]): void;
  export function on<K extends keyof Eventos>(tipo: K, h: (d: Eventos[K]) => void): () => void;
}