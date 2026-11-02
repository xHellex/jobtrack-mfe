# JobTrack

Aplicación para seguir postulaciones laborales, construida con
microfrontends (single-spa).

## Arquitectura
| MFE | Tecnología | Puerto | Levantar |
| --- | --- | --- | --- |
| root-config | single-spa 5 + single-spa-layout (orquestador) | 9000 | pnpm start |
| shared | módulo utilitario single-spa | 8400 | pnpm start |
| navbar | Angular 17 + single-spa-angular | 4200 | pnpm serve:single-spa:navbar |
| postulaciones | React 18 + single-spa-react | 8500 | pnpm start |
| stats | React 18 + single-spa-react | 8501 | pnpm start |
| api | json-server (solo desarrollo) | 3001 | pnpm api:demo |

- El import map está en root-config/src/index.ejs.
- Cada MFE es un proyecto independiente con su propio package.json y
  pnpm-lock.yaml: instalar y ejecutar comandos dentro de su carpeta.
- Gestor de paquetes: pnpm 11 (obligatorio). Las node_modules usan el store
  v11: no instalar con otra versión mayor de pnpm ni con npm.
- Para ver la app completa: levantar los 6 servicios y abrir
  http://localhost:9000.

## Tests
- postulaciones, stats, shared, root-config: pnpm test (Jest 27 +
  Testing Library en los MFE de React).
- navbar: pnpm test (Karma + Jasmine).
- Tipos (MFE de React): pnpm exec tsc -p . --noEmit --emitDeclarationOnly false
- Errores conocidos: RTK 2 requiere TypeScript 5.4+ (usa NoInfer), así que
  tsc muestra 6 errores en node_modules en postulaciones y stats. shared
  también falla en node_modules/@types/node. No intentar corregirlos fuera
  de una tarea dedicada; solo importan los errores en src/.

## Reglas propias de este proyecto
- DATOS PERSONALES: api/db.json contiene datos reales y no está
  versionado. Nunca leerlo, mostrarlo, copiarlo ni modificarlo. Para
  desarrollo, tests y ejemplos usar api/db.example.json y pnpm api:demo.
  Si cambia la estructura de datos, actualizar db.example.json con
  datos ficticios.
- VERSIONES: respetar las del proyecto. Angular 17, React 18, single-spa 5,
  Tailwind 3. Los MFE de React usan TypeScript 4.9.5: no usar sintaxis de
  TypeScript 5 o posterior (satisfies sí se puede: existe desde 4.9). No
  actualizar frameworks sin pedirlo.
- INDEPENDENCIA: un MFE nunca importa código de otro MFE. Lo compartido va
  en @Felo/shared. La comunicación entre MFE pasa por @Felo/shared o por
  eventos del navegador.
- SHARED: @Felo/shared es el contrato del dominio: tipos, constantes,
  validadores puros y bus de eventos. NUNCA estado (stores, caches),
  componentes de UI ni llamadas a la API (fetch, RTK Query).
- ESTILOS: cada MFE aísla sus estilos. No agregar CSS global que afecte a
  otros MFE. Cuidar que el reset base de Tailwind (preflight) no se cargue
  varias veces ni altere otros MFE.
- Al agregar un MFE o cambiar un puerto: actualizar el import map en
  root-config/src/index.ejs y la tabla de este archivo.
- json-server es solo para desarrollo local: no exponerlo a la red.

## Generales
- Antes de cambiar código, propone un plan corto y espera aprobación.
- Cambios pequeños y enfocados; no refactorizar lo que no se pidió.
- No agregar dependencias sin explicar por qué y qué alternativa se descartó.
- Accesibilidad WCAG 2.2 AA: semántica, foco visible, labels, contraste,
  aria-live en estados dinámicos.
- Todo cambio de lógica va con su test.
- Explica el porqué de cada decisión técnica y la alternativa descartada.

## Git
- Ramas: feature/<nombre>, fix/<nombre>, refactor/<nombre>, chore/<nombre>. Nunca trabajar
  en master.
- Conventional Commits en español: feat:, fix:, refactor:, test:, docs:, chore:.
- Nunca hacer push, merge, rebase ni borrar ramas o archivos sin confirmación.

## TypeScript
- strict; prohibido any (usar unknown y estrechar el tipo).
- Validar datos que vienen de la API antes de usarlos. Las postulaciones
  se validan con filtrarPostulaciones de @Felo/shared (transformResponse).
- Los declarations.d.ts de cada MFE declaran @Felo/shared con copias a
  mano de sus tipos: al cambiar shared/src/Felo-shared.ts, actualizarlas.

## Angular (navbar)
- Componentes standalone, ChangeDetectionStrategy.OnPush.
- Estado con signal() y computed(); input() y output() como funciones.
- Inyección con inject().
- Control flow nativo (@if, @for con track, @switch).

## React (postulaciones, stats)
- Componentes de función con hooks; props tipadas.
- Estado derivado se calcula en el render, no con useEffect.
- useEffect solo para sincronizar con sistemas externos y siempre con
  limpieza (AbortController en fetch).
- key estable en listas (id del dato, nunca el índice).
- Tests con Testing Library consultando por rol y texto visible.