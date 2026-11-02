import { filtrarPostulaciones } from '@Felo/shared';
import { validarRespuesta } from './api';

jest.mock('@Felo/shared', () => ({ filtrarPostulaciones: jest.fn(() => []) }), { virtual: true });

// La lógica de validación se prueba en shared; aquí solo el origen de los avisos
it('valida la respuesta de /postulaciones con origen stats', () => {
    const respuesta = [{ id: '1' }];
    expect(validarRespuesta(respuesta)).toEqual([]);
    expect(filtrarPostulaciones).toHaveBeenCalledWith(respuesta, 'stats');
});
