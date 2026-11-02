import React, { useEffect } from 'react';
import { useGetStatsQuery, statsApi } from './store/api';
import { on } from '@Felo/shared';
import type { Postulacion } from '@Felo/shared';
import { useDispatch } from 'react-redux';

export type EstadoResumen =
    | { tipo: 'cargando' }
    | { tipo: 'error' }
    | { tipo: 'datos'; total: number; activas: number };

interface ResultadoConsulta {
    data?: Postulacion[];
    error?: unknown;
}

// El orden importa: con datos previos y una reconsulta fallida se siguen mostrando los datos
export function estadoResumen({ data, error }: ResultadoConsulta): EstadoResumen {
    if (data !== undefined) {
        return { tipo: 'datos', total: data.length, activas: data.filter((p) => p.estado !== 'rechazado').length };
    }
    if (error !== undefined) return { tipo: 'error' };
    return { tipo: 'cargando' };
}

// Marcador visual oculto al lector de pantalla, que oye la palabra en su lugar
function Valor({ estado, campo }: { estado: EstadoResumen; campo: 'total' | 'activas' }) {
    if (estado.tipo === 'datos') return <>{estado[campo]}</>;
    const [marca, texto] = estado.tipo === 'cargando' ? ['…', 'cargando'] : ['—', 'sin dato'];
    return (
        <>
            <span aria-hidden="true">{marca}</span>
            <span className="sr-only">{texto}</span>
        </>
    );
}

export function Stats() {
    const estado = estadoResumen(useGetStatsQuery());
    const dispatch = useDispatch();

    useEffect(() => {
        const off = on('postulaciones:cambio', () => {
            dispatch(statsApi.util.invalidateTags(['Postulacion']));
        });
        return () => off();
    }, [dispatch]);

    return (
        <div className="p-6 md:p-8 mx-auto w-full max-w-7xl mx-auto rounded-xl border border-border bg-surface-2 shadow-card box-border mt-6">
            <h2 className="mt-0 text-xl font-bold mb-6 text-text">Resumen (Stats MFE)</h2>
            {estado.tipo === 'error' && (
                <p role="alert" className="mt-0 mb-6 text-text font-medium">
                    No se pudieron cargar las estadísticas.
                </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 sm:gap-6">
                <div className="bg-surface p-6 sm:p-8 rounded-xl shadow-card flex flex-col items-center justify-center border border-border hover:-translate-y-1 transition-transform">
                    <strong className="text-muted uppercase text-xs sm:text-sm tracking-wider">Total</strong>
                    <span className="text-text text-4xl sm:text-5xl font-black mt-3 leading-none">
                        <Valor estado={estado} campo="total" />
                    </span>
                </div>
                <div className="bg-surface p-6 sm:p-8 rounded-xl shadow-card flex flex-col items-center justify-center border border-border hover:-translate-y-1 transition-transform">
                    <strong className="text-muted uppercase text-xs sm:text-sm tracking-wider">Activas</strong>
                    <span className="text-accent text-4xl sm:text-5xl font-black mt-3 leading-none">
                        <Valor estado={estado} campo="activas" />
                    </span>
                </div>
            </div>
        </div>
    );
}
