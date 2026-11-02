import React, { useEffect, useState } from 'react';
import { emit } from '@Felo/shared';
import type { Postulacion } from '@Felo/shared';
import { useListarQuery, useCrearMutation } from './store/api';
import type { ListaValidada } from './store/api';

export type EstadoLista =
    | { tipo: 'cargando' }
    | { tipo: 'error'; reintentando: boolean }
    | { tipo: 'vacio'; descartados: number }
    | { tipo: 'datos'; postulaciones: Postulacion[]; descartados: number };

interface ResultadoConsulta {
    data?: ListaValidada;
    error?: unknown;
    isFetching: boolean;
}

// El orden importa: si una reconsulta falla, RTK Query conserva los datos anteriores y se siguen mostrando
export function estadoLista({ data, error, isFetching }: ResultadoConsulta): EstadoLista {
    if (data !== undefined) {
        const { postulaciones, descartados } = data;
        return postulaciones.length === 0 ? { tipo: 'vacio', descartados } : { tipo: 'datos', postulaciones, descartados };
    }
    if (error !== undefined) return { tipo: 'error', reintentando: isFetching };
    return { tipo: 'cargando' };
}

const textoDescartados = (n: number) =>
    n === 1
        ? '1 registro no se muestra porque tiene datos inválidos.'
        : `${n} registros no se muestran porque tienen datos inválidos.`;

export function ListaPostulaciones() {
    const resultado = useListarQuery();
    const { data, refetch } = resultado;
    const estado = estadoLista(resultado);
    const [crear] = useCrearMutation();
    const [empresa, setEmpresa] = useState('');
    const [cargo, setCargo] = useState('');

    useEffect(() => {
        if (!data) return; // todavía no hay lista real (cargando o error): no se avisa
        const { postulaciones } = data;
        const activas = postulaciones.filter((p) => p.estado !== 'rechazado').length;
        emit('postulaciones:cambio', { total: postulaciones.length, activas });
    }, [data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (empresa && cargo) {
            await crear({
                empresa,
                cargo,
                estado: 'postulado',
                fecha: new Date().toISOString().split('T')[0]
            });
            setEmpresa('');
            setCargo('');
        }
    };

    return (
        <div className="p-4 md:p-6 mx-auto w-full max-w-7xl">
            <h2 className="text-2xl font-extrabold mb-6 text-text">Mis Postulaciones (React MFE)</h2>

            {estado.tipo === 'cargando' && <p role="status" className="text-muted">Cargando postulaciones…</p>}

            {estado.tipo === 'error' && (
                <div className="bg-surface p-4 rounded-lg shadow-card border border-border flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* La alerta queda montada y se vacía al reintentar: si vuelve a fallar, el texto se inserta y se anuncia de nuevo */}
                    <p role="alert" className="m-0 flex-grow text-text font-medium">
                        {!estado.reintentando && 'No se pudieron cargar tus postulaciones.'}
                    </p>
                    {/* aria-disabled en vez de disabled: con disabled el navegador saca el foco del botón */}
                    <button
                        type="button"
                        aria-disabled={estado.reintentando}
                        onClick={() => { if (!estado.reintentando) refetch(); }}
                        className="bg-accent hover:bg-accent-hover text-on-accent px-6 py-3 rounded font-bold transition-colors w-full sm:w-auto shadow-md cursor-pointer aria-disabled:opacity-60 aria-disabled:cursor-wait"
                    >
                        {estado.reintentando ? 'Reintentando…' : 'Reintentar'}
                    </button>
                </div>
            )}

            {(estado.tipo === 'vacio' || estado.tipo === 'datos') && (
                <form onSubmit={handleSubmit} className="mb-6 flex gap-3 flex-wrap bg-surface p-4 rounded-lg shadow-card border border-border">
                    <div className="flex flex-col gap-1 flex-grow">
                        <label htmlFor="empresa" className="text-sm font-medium text-text">Empresa</label>
                        <input
                            id="empresa"
                            placeholder="ej. Banco de Chile"
                            value={empresa}
                            onChange={(e) => setEmpresa(e.target.value)}
                            className="bg-surface-2 text-text border border-muted rounded px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-grow">
                        <label htmlFor="cargo" className="text-sm font-medium text-text">Cargo</label>
                        <input
                            id="cargo"
                            placeholder="ej. Frontend"
                            value={cargo}
                            onChange={(e) => setCargo(e.target.value)}
                            className="bg-surface-2 text-text border border-muted rounded px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-colors"
                        />
                    </div>
                    <button type="submit" className="bg-accent hover:bg-accent-hover text-on-accent px-6 py-3 rounded font-bold transition-colors w-full sm:w-auto sm:self-end shadow-md cursor-pointer">
                        Crear Postulación
                    </button>
                </form>
            )}

            {(estado.tipo === 'vacio' || estado.tipo === 'datos') && estado.descartados > 0 && (
                <p className="text-muted">{textoDescartados(estado.descartados)}</p>
            )}

            {estado.tipo === 'vacio' && (
                <p className="text-muted">Aún no tienes postulaciones. Crea la primera con el formulario.</p>
            )}

            {estado.tipo === 'datos' && (<>
                <div className="hidden sm:block overflow-x-auto rounded-lg shadow-card border border-border bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-2 text-muted uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Empresa</th>
                                <th className="p-4">Cargo</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {estado.postulaciones.map((p) => (
                                <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                                    <td className="p-4 font-medium text-text">{p.empresa}</td>
                                    <td className="p-4 text-text">{p.cargo}</td>
                                    <td className="p-4">
                                        <span className="badge" data-estado={p.estado}>{p.estado}</span>
                                    </td>
                                    <td className="p-4 text-muted">{p.fecha}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="sm:hidden grid grid-cols-1 gap-4">
                    {estado.postulaciones.map((p) => (
                        <div key={p.id} className="bg-surface p-5 rounded-xl shadow-card border border-border flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-text leading-tight">{p.cargo}</h3>
                                    <p className="text-muted text-sm">{p.empresa}</p>
                                </div>
                                <span className="badge" data-estado={p.estado}>{p.estado}</span>
                            </div>
                            <div className="text-xs text-muted mt-2 border-t border-border pt-3">
                                Postulado el {p.fecha}
                            </div>
                        </div>
                    ))}
                </div>
            </>)}
        </div>
    );
}