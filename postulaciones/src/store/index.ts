import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';

export const crearStore = () => configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type AppStore = ReturnType<typeof crearStore>;