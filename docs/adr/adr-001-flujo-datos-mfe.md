---
tipo: adr
estado: aceptado
fecha: 2026-11-01
---
# ADR-001: Flujo de datos entre MFE (stats y postulaciones)

## Contexto
- Regla de arquitectura: un store de Redux por MFE, sin store global.
- stats y postulaciones piden GET /postulaciones cada uno con su RTK Query.
- postulaciones emite 'postulaciones:cambio' { total, activas } cuando cambia la
  lista; stats lo escucha e invalida su caché (tag Postulacion).
- Medición (2026-11-01, Network): 4 peticiones al cargar /postulaciones, con la
  API encendida y apagada, todas en ~600 ms; luego ninguna. No hay bucle.
- Origen (revisión con Codex): 2 iniciales (una por MFE) + 2 reconsultas de
  stats por el evento: una al montar con la lista vacía y otra al llegar los
  datos. No hay React.StrictMode, así que ocurren también en producción.

## Opciones
A. stats solo escucha el evento, sin pedir a la API.
   + 1 sola petición. - stats depende de que postulaciones esté montado:
   rompe el despliegue independiente.
B. stats pide su lista e ignora el evento.
   + independencia total. - rompe la sincronización por eventos; números
   desfasados tras crear una postulación.
C. postulaciones no emite mientras la lista está cargando o vacía por carga.
   + respeta store por MFE y eventos; elimina solo lo redundante (4 -> 3 o 2).
   - la duplicación base (una petición por MFE) se mantiene, a propósito.

## Decisión
C. La duplicación base es el costo aceptado de "un store por MFE"; solo se
elimina la emisión redundante.

## Consecuencias
- Se espera bajar de 4 a 2-3 peticiones al cargar. Verificar en Network.
- Si en el futuro se necesita una sola fuente de datos, revisar la regla de
  store por MFE en un nuevo ADR, no en un cambio puntual.

## Resultado (2026-11-01)
- Causa precisa: data = [] por defecto creaba un arreglo nuevo en cada render;
  el efecto emitía {0,0} en cada render de la carga. Ahora depende de data.
- Tests: carga (no emite), lista vacía real (emite {0,0}), error (no emite).
  Carga y error fallaban antes del cambio.
- Network: API encendida 4 -> 3; API apagada 4 -> 2. La tercera con API
  encendida es la reconsulta de stats al llegar los datos (sincronización
  que se decidió conservar).
- Hallazgo: con la API caída, navbar, stats y la tabla siguen mostrando 0
  por su valor inicial, no por un evento. No distinguen cargando / error /
  vacío. Se resolvió después: postulaciones distingue cargando, error y
  vacío; stats, cargando y error; navbar muestra "sin dato" hasta recibir
  el evento.