import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { filtrarPostulaciones } from '@Felo/shared';
import type { Postulacion } from '@Felo/shared';

// Descarta registros mal formados en vez de romper el conteo
export const validarRespuesta = (res: unknown): Postulacion[] => filtrarPostulaciones(res, 'stats');

export const statsApi = createApi({
    reducerPath: 'statsApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001/' }),
    tagTypes: ['Postulacion'],
    endpoints: (builder) => ({
        getStats: builder.query<Postulacion[], void>({
            query: () => 'postulaciones',
            transformResponse: validarRespuesta,
            providesTags: ['Postulacion'],
        }),
    }),
});

export const { useGetStatsQuery } = statsApi;
