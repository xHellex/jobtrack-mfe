import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { filtrarPostulaciones } from '@Felo/shared';
import type { Postulacion } from '@Felo/shared';

export interface ListaValidada {
    postulaciones: Postulacion[];
    descartados: number;
}

// Descarta registros mal formados en vez de romper la lista, y cuenta cuántos para avisar al usuario
export const validarRespuesta = (res: unknown): ListaValidada => {
    const postulaciones = filtrarPostulaciones(res, 'postulaciones');
    return { postulaciones, descartados: Array.isArray(res) ? res.length - postulaciones.length : 0 };
};

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001' }),
    tagTypes: ['Postulacion'], // Para manejo automático de caché
    endpoints: (builder) => ({
        listar: builder.query<ListaValidada, void>({
            query: () => '/postulaciones',
            transformResponse: validarRespuesta,
            providesTags: ['Postulacion'],
        }),
        crear: builder.mutation<Postulacion, Omit<Postulacion, 'id'>>({
            query: (body) => ({ url: '/postulaciones', method: 'POST', body }),
            invalidatesTags: ['Postulacion'], // Refresca las listas si se crea una
        }),
    }),
});

export const { useListarQuery, useCrearMutation } = api;