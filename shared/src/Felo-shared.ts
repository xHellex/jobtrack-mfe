// Fuente única de los estados: el tipo se deriva del arreglo que usa la validación
const ESTADOS = ['postulado', 'entrevista', 'oferta', 'rechazado'] as const;
export type EstadoPostulacion = typeof ESTADOS[number];

export interface Postulacion {
    id: string;
    empresa: string;
    cargo: string;
    estado: EstadoPostulacion;
    fecha: string;
}

export function esPostulacion(x: unknown): x is Postulacion {
    if (typeof x !== 'object' || x === null) return false;
    const p = x as Record<string, unknown>;
    return (
        typeof p.id === 'string' &&
        typeof p.empresa === 'string' &&
        typeof p.cargo === 'string' &&
        typeof p.fecha === 'string' &&
        ESTADOS.includes(p.estado as EstadoPostulacion)
    );
}

// Solo se registra el id: empresa y cargo son datos personales
function idSeguro(x: unknown): string | number {
    if (typeof x !== 'object' || x === null) return '(sin id)';
    const id = (x as Record<string, unknown>).id;
    return typeof id === 'string' || typeof id === 'number' ? id : '(sin id)';
}

// origen: nombre del MFE que llama, para prefijar los avisos de consola
export function filtrarPostulaciones(res: unknown, origen: string): Postulacion[] {
    if (!Array.isArray(res)) {
        console.warn(`[${origen}] respuesta inesperada de /postulaciones: no es un arreglo`);
        return [];
    }
    const validas = res.filter(esPostulacion);
    if (validas.length < res.length) {
        const ids = res.filter((x) => !esPostulacion(x)).map(idSeguro);
        console.warn(`[${origen}] ${ids.length} registro(s) descartados, ids: ${JSON.stringify(ids)}`);
    }
    return validas;
}

type Eventos = {
    'postulaciones:cambio': { total: number; activas: number };
};

// Función para emitir eventos desde un MFE a otro
export function emit<K extends keyof Eventos>(tipo: K, detalle: Eventos[K]) {
    window.dispatchEvent(new CustomEvent(tipo, { detail: detalle }));
}

// Función para escuchar eventos reaccionando a lo que diga otro MFE
export function on<K extends keyof Eventos>(tipo: K, handler: (d: Eventos[K]) => void) {
    const fn = (e: Event) => handler((e as CustomEvent).detail);
    window.addEventListener(tipo, fn);
    return () => window.removeEventListener(tipo, fn); // Retorna una función para limpiar oyentes muertos
}