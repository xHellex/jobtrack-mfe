---
tipo: adr
estado: aceptado
fecha: 2026-11-01
---
# ADR-002: Rol de @Felo/shared

## Contexto
- Definición original: utility module de single-spa con un bus de eventos
  tipado (emit / on) y el contrato Eventos.
- Entre el 31-10 y el 01-11 se le agregó: interface Postulacion, ESTADOS
  (de donde se deriva EstadoPostulacion), y los validadores esPostulacion y
  filtrarPostulaciones(res, origen), que usan stats y postulaciones.
- Motivo: el tipo y su validación deben vivir juntos; si se separan, se
  desalinean y los registros se descartan sin aviso.
- Reglas que deben mantenerse: un store por MFE, sin store global;
  despliegue independiente; comunicación por eventos.

## Opciones
A. shared solo como bus de eventos; cada MFE define su tipo y validación.
   + shared mínimo. - tipo y validación duplicados en cada MFE; se desalinean.
B. shared como contrato del dominio: tipos, constantes, validadores y eventos.
   + una sola fuente de verdad del dato y su validación.
   - shared crece; los MFE dependen de él en tiempo de ejecución (ya pasaba
     por emit / on).
C. Un módulo nuevo @Felo/dominio, separado del bus de eventos.
   + separación más estricta. - otro servicio, puerto y despliegue para
     pocas líneas de código; complejidad que el proyecto no necesita hoy.

## Decisión
B, con límites explícitos. shared puede contener:
- Tipos e interfaces del dominio (Postulacion, EstadoPostulacion).
- Constantes del dominio (ESTADOS).
- Validadores puros (único efecto permitido: console.warn sin datos
  personales).
- El contrato y el bus de eventos (Eventos, emit, on).
shared NUNCA contiene:
- Estado (stores de Redux, caches, variables globales mutables).
- Componentes de UI.
- Llamadas a la API (fetch, RTK Query).

## Consecuencias
- shared se despliega antes que stats y postulaciones.
- La validación se prueba una vez en shared; los MFE la simulan en sus tests
  y solo prueban que la usan con su origen.
- Las declarations.d.ts de cada MFE son copias a mano del contrato
  (pendiente: generarlas desde shared).
- Si shared necesitara estado o acceso a la API, revisar esta decisión en un
  nuevo ADR: sería volver a acoplar los MFE.