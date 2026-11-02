import { esPostulacion, filtrarPostulaciones } from './Felo-shared';

const valida = { id: '1', empresa: 'Acme', cargo: 'Frontend', estado: 'postulado', fecha: '2026-01-15' };

describe('esPostulacion', () => {
    it('acepta una postulación válida', () => {
        expect(esPostulacion(valida)).toBe(true);
    });

    it.each(['postulado', 'entrevista', 'oferta', 'rechazado'])('acepta el estado %s', (estado) => {
        expect(esPostulacion({ ...valida, estado })).toBe(true);
    });

    it('rechaza un estado desconocido', () => {
        expect(esPostulacion({ ...valida, estado: 'archivado' })).toBe(false);
    });

    it('rechaza si falta un campo', () => {
        const { cargo, ...sinCargo } = valida;
        expect(esPostulacion(sinCargo)).toBe(false);
    });

    it('rechaza null y valores que no son objeto', () => {
        expect(esPostulacion(null)).toBe(false);
        expect(esPostulacion('texto')).toBe(false);
    });
});

describe('filtrarPostulaciones', () => {
    let warn: jest.SpyInstance;
    beforeEach(() => {
        warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => warn.mockRestore());

    it('devuelve [] y avisa si la respuesta no es un arreglo', () => {
        expect(filtrarPostulaciones({ error: 'x' }, 'test')).toEqual([]);
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('descarta inválidos y avisa conteo e ids sin datos personales', () => {
        const invalida = { ...valida, id: '2', empresa: 'Secreta SA', cargo: 'Cargo Secreto', estado: 'archivado' };
        const sinId = { empresa: 'Otra SA' };
        expect(filtrarPostulaciones([valida, invalida, sinId], 'test')).toEqual([valida]);
        expect(warn).toHaveBeenCalledTimes(1);
        const mensaje = String(warn.mock.calls[0][0]);
        expect(mensaje).toContain('2 registro(s)');
        expect(mensaje).toContain('"2"');
        expect(mensaje).toContain('(sin id)');
        expect(mensaje).not.toMatch(/Secreta|Cargo Secreto|Otra SA/);
    });

    it('devuelve todo y no avisa si todos son válidos', () => {
        const otra = { ...valida, id: '3' };
        expect(filtrarPostulaciones([valida, otra], 'test')).toEqual([valida, otra]);
        expect(warn).not.toHaveBeenCalled();
    });

    it('prefija los avisos con el origen indicado', () => {
        filtrarPostulaciones('no es arreglo', 'postulaciones');
        filtrarPostulaciones([{ id: '9' }], 'stats');
        expect(String(warn.mock.calls[0][0])).toMatch(/^\[postulaciones\] /);
        expect(String(warn.mock.calls[1][0])).toMatch(/^\[stats\] /);
    });
});
