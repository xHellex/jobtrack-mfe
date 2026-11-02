import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { emit } from '@Felo/shared';
import { useListarQuery } from './store/api';
import { ListaPostulaciones, estadoLista } from './ListaPostulaciones';

const mockCrear = jest.fn();

jest.mock('@Felo/shared', () => ({ emit: jest.fn() }), { virtual: true });
jest.mock('./store/api', () => ({
    useListarQuery: jest.fn(),
    useCrearMutation: () => [mockCrear],
}));

const listar = useListarQuery as jest.Mock;
const refetch = jest.fn();
const fallo = { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' };
const lista = [
    { id: '1', empresa: 'Acme', cargo: 'Frontend', estado: 'postulado', fecha: '2026-01-01' },
    { id: '2', empresa: 'Globex', cargo: 'Backend', estado: 'rechazado', fecha: '2026-01-02' },
];

const cargando = { data: undefined, error: undefined, isFetching: true, refetch };
const error = { data: undefined, error: fallo, isFetching: false, refetch };
const reintentando = { data: undefined, error: fallo, isFetching: true, refetch };
const vacio = { data: { postulaciones: [], descartados: 0 }, error: undefined, isFetching: false, refetch };
const datos = { data: { postulaciones: lista, descartados: 0 }, error: undefined, isFetching: false, refetch };

beforeEach(() => jest.clearAllMocks());

describe('estadoLista', () => {
    it.each([
        ['sin data ni error', cargando, { tipo: 'cargando' }],
        ['error', error, { tipo: 'error', reintentando: false }],
        ['error mientras reconsulta', reintentando, { tipo: 'error', reintentando: true }],
        ['lista vacía', vacio, { tipo: 'vacio', descartados: 0 }],
        ['lista con datos', datos, { tipo: 'datos', postulaciones: lista, descartados: 0 }],
        // Una reconsulta fallida conserva los datos anteriores (supuesto 2 de la spec)
        ['datos anteriores y error', { ...datos, error: fallo }, { tipo: 'datos', postulaciones: lista, descartados: 0 }],
    ])('%s', (_, resultado, esperado) => {
        expect(estadoLista(resultado)).toEqual(esperado);
    });
});

describe('estados en pantalla', () => {
    it.each([['cargando', cargando], ['error', error], ['vacío', vacio], ['datos', datos]])(
        'muestra el título en estado %s',
        (_, resultado) => {
            listar.mockReturnValue(resultado);
            render(<ListaPostulaciones />);
            expect(screen.getByRole('heading', { name: /Mis Postulaciones/ })).toBeInTheDocument();
        },
    );

    it('cargando: anuncia la carga y no muestra formulario ni tabla', () => {
        listar.mockReturnValue(cargando);
        render(<ListaPostulaciones />);
        expect(screen.getByRole('status')).toHaveTextContent('Cargando postulaciones');
        expect(screen.queryByRole('button', { name: 'Crear Postulación' })).not.toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('error: muestra una alerta y reintenta al pulsar el botón', () => {
        listar.mockReturnValue(error);
        render(<ListaPostulaciones />);
        expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar tus postulaciones.');
        expect(screen.queryByRole('button', { name: 'Crear Postulación' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
        expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('reintentando: el botón sigue en pantalla, deshabilitado, y no vuelve a reintentar', () => {
        listar.mockReturnValue(reintentando);
        render(<ListaPostulaciones />);
        const boton = screen.getByRole('button', { name: 'Reintentando…' });
        expect(boton).toHaveAttribute('aria-disabled', 'true');
        // La alerta queda montada y vacía: el texto vuelve a insertarse si el reintento falla
        expect(screen.getByRole('alert')).toBeEmptyDOMElement();

        fireEvent.click(boton);
        expect(refetch).not.toHaveBeenCalled();
    });

    it('vacío: muestra el formulario y una invitación, sin tabla ni avisos', () => {
        listar.mockReturnValue(vacio);
        render(<ListaPostulaciones />);
        expect(screen.getByText(/Aún no tienes postulaciones/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Crear Postulación' })).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('datos: muestra la lista, sin avisos', () => {
        listar.mockReturnValue(datos);
        render(<ListaPostulaciones />);
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByText('Acme').length).toBeGreaterThan(0);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});

describe('formulario', () => {
    it('Empresa y Cargo tienen etiqueta visible, crean la postulación y se vacían', async () => {
        listar.mockReturnValue(vacio);
        render(<ListaPostulaciones />);
        const empresa = screen.getByRole('textbox', { name: 'Empresa' });
        const cargo = screen.getByRole('textbox', { name: 'Cargo' });
        fireEvent.change(empresa, { target: { value: 'Acme' } });
        fireEvent.change(cargo, { target: { value: 'Frontend' } });
        fireEvent.click(screen.getByRole('button', { name: 'Crear Postulación' }));
        expect(mockCrear).toHaveBeenCalledWith(expect.objectContaining({ empresa: 'Acme', cargo: 'Frontend', estado: 'postulado' }));
        await waitFor(() => expect(empresa).toHaveValue(''));
        expect(cargo).toHaveValue('');
    });

    // Clases, no contraste: evita revertir sin aviso el borde AA (1.4.11) y el anillo de foco visible
    it.each(['Empresa', 'Cargo'])('%s tiene borde contrastado y anillo de foco', (nombre) => {
        listar.mockReturnValue(vacio);
        render(<ListaPostulaciones />);
        const campo = screen.getByRole('textbox', { name: nombre });
        expect(campo).toHaveClass('border-muted', 'focus-visible:outline-accent');
        expect(campo).not.toHaveClass('outline-none');
    });
});

describe('aviso de registros descartados', () => {
    const conDescartados = (descartados: number) => ({ ...datos, data: { postulaciones: lista, descartados } });

    it('avisa cuántos registros no se muestran', () => {
        listar.mockReturnValue(conDescartados(2));
        render(<ListaPostulaciones />);
        expect(screen.getByText('2 registros no se muestran porque tienen datos inválidos.')).toBeInTheDocument();
    });

    it('usa singular con un solo registro', () => {
        listar.mockReturnValue(conDescartados(1));
        render(<ListaPostulaciones />);
        expect(screen.getByText('1 registro no se muestra porque tiene datos inválidos.')).toBeInTheDocument();
    });

    it('también avisa si todos los registros eran inválidos', () => {
        listar.mockReturnValue({ ...vacio, data: { postulaciones: [], descartados: 3 } });
        render(<ListaPostulaciones />);
        expect(screen.getByText(/3 registros no se muestran/)).toBeInTheDocument();
    });

    it('no avisa si no hay descartados', () => {
        listar.mockReturnValue(datos);
        render(<ListaPostulaciones />);
        expect(screen.queryByText(/no se muestra/)).not.toBeInTheDocument();
    });
});

describe('emisión de postulaciones:cambio', () => {
    it('no emite mientras la lista carga y emite una vez al llegar los datos', () => {
        listar.mockReturnValue(cargando);
        const { rerender } = render(<ListaPostulaciones />);
        rerender(<ListaPostulaciones />);
        expect(emit).not.toHaveBeenCalled();

        listar.mockReturnValue(datos);
        rerender(<ListaPostulaciones />);
        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith('postulaciones:cambio', { total: 2, activas: 1 });
    });

    it('emite total 0 cuando la lista queda vacía tras cargar', () => {
        listar.mockReturnValue(vacio);
        render(<ListaPostulaciones />);
        expect(emit).toHaveBeenCalledWith('postulaciones:cambio', { total: 0, activas: 0 });
    });

    it('no emite si la API falla', () => {
        listar.mockReturnValue(error);
        render(<ListaPostulaciones />);
        expect(emit).not.toHaveBeenCalled();
    });
});
