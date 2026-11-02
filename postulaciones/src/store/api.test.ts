import { filtrarPostulaciones } from '@Felo/shared';
import { validarRespuesta } from './api';

jest.mock('@Felo/shared', () => ({ filtrarPostulaciones: jest.fn() }), { virtual: true });

const filtrar = filtrarPostulaciones as jest.Mock;
const valida = { id: '1', empresa: 'Acme', cargo: 'Frontend', estado: 'postulado', fecha: '2026-01-01' };

// La lógica de validación se prueba en shared; aquí el origen de los avisos y el conteo de descartados
it('valida la respuesta de /postulaciones con origen postulaciones', () => {
    filtrar.mockReturnValue([]);
    const respuesta = [{ id: '1' }];
    validarRespuesta(respuesta);
    expect(filtrarPostulaciones).toHaveBeenCalledWith(respuesta, 'postulaciones');
});

it('cuenta los registros que la validación descarta', () => {
    filtrar.mockReturnValue([valida]);
    expect(validarRespuesta([valida, { id: '2' }, null])).toEqual({ postulaciones: [valida], descartados: 2 });
});

it('no cuenta descartados si la respuesta no es un arreglo', () => {
    filtrar.mockReturnValue([]);
    expect(validarRespuesta({ error: 'x' })).toEqual({ postulaciones: [], descartados: 0 });
});
