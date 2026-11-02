import React from 'react';
import { render, screen } from '@testing-library/react';
import { on } from '@Felo/shared';
import { useGetStatsQuery, statsApi } from './store/api';
import { Stats, estadoResumen } from './Stats';

jest.mock('@Felo/shared', () => ({ on: jest.fn(() => jest.fn()) }), { virtual: true });
jest.mock('./store/api', () => ({
    useGetStatsQuery: jest.fn(),
    statsApi: { util: { invalidateTags: jest.fn((tags: string[]) => ({ type: 'invalidar', tags })) } },
}));
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));

const consulta = useGetStatsQuery as jest.Mock;
const fallo = { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' };
const lista = [
    { id: '1', empresa: 'Acme', cargo: 'Frontend', estado: 'postulado', fecha: '2026-01-01' },
    { id: '2', empresa: 'Globex', cargo: 'Backend', estado: 'rechazado', fecha: '2026-01-02' },
];

const cargando = { data: undefined, error: undefined };
const error = { data: undefined, error: fallo };
const vacio = { data: [], error: undefined };
const datos = { data: lista, error: undefined };

beforeEach(() => jest.clearAllMocks());

describe('estadoResumen', () => {
    it.each([
        ['sin data ni error', cargando, { tipo: 'cargando' }],
        ['error', error, { tipo: 'error' }],
        ['lista vacía', vacio, { tipo: 'datos', total: 0, activas: 0 }],
        ['lista con datos', datos, { tipo: 'datos', total: 2, activas: 1 }],
        // Una reconsulta fallida conserva los datos anteriores (supuesto 2 de la spec)
        ['datos anteriores y error', { ...datos, error: fallo }, { tipo: 'datos', total: 2, activas: 1 }],
    ])('%s', (_, resultado, esperado) => {
        expect(estadoResumen(resultado)).toEqual(esperado);
    });
});

describe('estados en pantalla', () => {
    it('cargando: no muestra 0, anuncia "cargando" y no hay alerta', () => {
        consulta.mockReturnValue(cargando);
        render(<Stats />);
        expect(screen.queryByText('0')).not.toBeInTheDocument();
        expect(screen.getAllByText('cargando')).toHaveLength(2);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('error: alerta, no muestra 0 y anuncia "sin dato"', () => {
        consulta.mockReturnValue(error);
        render(<Stats />);
        expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las estadísticas.');
        expect(screen.queryByText('0')).not.toBeInTheDocument();
        expect(screen.getAllByText('sin dato')).toHaveLength(2);
    });

    it('lista vacía: muestra el 0 verdadero en Total y Activas', () => {
        consulta.mockReturnValue(vacio);
        render(<Stats />);
        expect(screen.getAllByText('0')).toHaveLength(2);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('datos: Total 2 y Activas 1 con una rechazada', () => {
        consulta.mockReturnValue(datos);
        render(<Stats />);
        expect(screen.getByText('Total').nextSibling).toHaveTextContent('2');
        expect(screen.getByText('Activas').nextSibling).toHaveTextContent('1');
    });
});

it('postulaciones:cambio invalida la caché de Postulacion', () => {
    consulta.mockReturnValue(datos);
    render(<Stats />);
    const [tipo, handler] = (on as jest.Mock).mock.calls[0];
    expect(tipo).toBe('postulaciones:cambio');
    handler({ total: 3, activas: 2 });
    expect(statsApi.util.invalidateTags).toHaveBeenCalledWith(['Postulacion']);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'invalidar', tags: ['Postulacion'] });
});
