import { configureStore } from '@reduxjs/toolkit';
import { statsApi } from './api';

export const store = configureStore({
    reducer: {
        [statsApi.reducerPath]: statsApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(statsApi.middleware),
});
