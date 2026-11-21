# Etamanïk — Frontend

Interfaz web de **Etamanïk** (edTech), plataforma de apoyo pedagógico para docentes de primaria de
Guatemala. Se conecta con el backend del repositorio [DiliRo/EdTech](https://github.com/DiliRo/EdTech).

Stack: React 19 · Vite · Chakra UI v2 · React Router 7 · Axios · Vitest + Testing Library.

> Estado: **estructura inicial**. Inicio de sesión y registro tienen interfaz y validación, pero
> todavía no se conectan con el backend. El panel muestra el estado real del servidor.

## Instalación y ejecución

Requisitos: Node.js 20.19 o superior y el backend corriendo (por defecto en `http://localhost:3000`).

```bash
git clone https://github.com/DiliRo/EdTech_Front.git
cd EdTech_Front
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm run dev                 # http://localhost:5173
```

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run preview` | Sirve la compilación |
| `npm test` | Pruebas (Vitest) |
| `npm run lint` | ESLint |

### Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | URL del backend, **incluyendo `/api`** |
| `VITE_API_TIMEOUT_MS` | `15000` | Tiempo máximo de espera por petición |

El backend debe permitir el origen del frontend: en su `.env`, `CORS_ORIGIN=http://localhost:5173`.

## Paleta y tema

Todos los colores están centralizados en `src/theme/`. Los componentes usan **tokens semánticos**
(`bg.app`, `text.primary`…), nunca valores hexadecimales.

| Color | Uso | Token |
|---|---|---|
| `#6FD1D7` | Fondo principal | `bg.app` |
| `#17324D` | Títulos, encabezados, menú lateral y botones principales | `text.primary`, `bg.sidebar` |
| `#263238` | Texto secundario, descripciones y etiquetas | `text.secondary` |
| Turquesa suave (`#A9E3E7`, `#8CDADF`, `#C5EDEF`) | Tarjetas, contenedores y campos | `bg.surface`, `bg.surfaceMuted`, `bg.input` |
| Blanco | Solo texto sobre fondos oscuros | `text.onDark` |

- No hay superficies blancas: tarjetas y formularios usan variantes del turquesa.
- El contraste de cada combinación texto/fondo cumple WCAG AA (≥ 4.5:1); lo comprueba
  `tests/theme.test.js` (p. ej. `#17324D` sobre `#6FD1D7` = 7.4:1, blanco sobre `#17324D` = 13.1:1).
- Variantes propias de botón: `primary` (navy), `secondary` (contorno navy), `ghost`.

## Estructura

```
src/
├── main.jsx · App.jsx        # punto de entrada: tema, sesión y router
├── router.jsx                # rutas (React Router 7)
├── theme/
│   ├── colors.js             # paleta (única fuente de colores)
│   ├── semanticTokens.js     # tokens por función: fondos, texto, bordes, estados
│   ├── components/index.js   # estilos de Button, Card, Input, Select, Alert, Heading…
│   └── index.js              # extendTheme
├── layouts/
│   ├── MainLayout.jsx        # menú lateral (cajón en móvil) + encabezado + contenido
│   └── AuthLayout.jsx        # tarjeta centrada para inicio de sesión y registro
├── components/
│   ├── layout/               # Sidebar, NavItem, Header, navigation.js (elementos del menú)
│   ├── feedback/             # LoadingState, ErrorState, EmptyState, AsyncContent
│   ├── auth/                 # ProtectedRoute, PublicOnlyRoute
│   ├── catalog/              # OptionGroup, GradeSelector, SubjectSelector, TopicSelector, TopicDetail
│   ├── classrooms/           # ClassroomCard, ClassroomFormModal, ClassroomInfo, StudentTable, StudentFormModal…
│   ├── common/               # ConfirmDialog, Pagination, SearchInput, SegmentedControl
│   ├── methodologies/        # MethodologyCard, MethodologyFilters, MethodologyContent, MethodologyForm, ListEditor…
│   ├── assessments/          # GradesTable, AssessmentFormModal, ClassroomPerformance, StudentHistory, PercentChart, Indicators…
│   ├── ui/                   # BrandLogo, PageHeader, SurfaceCard, FormField, FormAlert, PasswordInput…
│   └── ServerStatusCard.jsx  # estado real de GET /api/health
├── pages/                    # Login, Register, Dashboard, Curriculum, Classrooms, Methodologies, Profile…
├── services/
│   ├── apiClient.js          # Axios centralizado (VITE_API_URL, token Bearer, errores)
│   ├── auth.service.js       # POST /auth/register, POST /auth/login, GET /auth/me
│   ├── teacher.service.js    # PATCH /teachers/me
│   ├── catalog.service.js    # GET /grades, /subjects, /topics, /topics/:id
│   ├── classroom.service.js  # /classrooms (B4)
│   ├── student.service.js    # /classrooms/:id/students, /students/:id (B4)
│   ├── methodology.service.js # /methodologies (B5)
│   ├── assessment.service.js # /assessments, /classrooms/:id/performance, /students/:id/results|progress (B6)
│   └── health.service.js
├── hooks/                    # useAsync, useQuery, usePagination, useNotify, useAuth, useFormState…
├── context/                  # AuthContext (sesión) y GuidePlanningContext (metodología para la próxima guía)
└── utils/                    # constantes, env, jwt, tokenStorage, apiError, validation, catalog, classroom, methodology, assessment, text
tests/                        # Vitest + Testing Library
```

## Rutas

| Ruta | Página |
|---|---|
| `/` | Redirige a `/dashboard` |
| `/login`, `/register` | Públicas: si ya hay sesión redirigen al panel |
| `/dashboard` | Privada. Panel principal |
| `/curriculo` | Privada. Grados → materias → temas → contenido curricular |
| `/perfil` | Privada. Nombre, apellido e idioma preferido |
| `/aulas` | Privada. Aulas del docente: filtros, búsqueda, paginación, crear, editar, archivar, restaurar |
| `/aulas/:classroomId` | Privada. Información del aula y sus estudiantes |
| `/metodologias` | Privada. Metodologías predeterminadas y propias, con filtros |
| `/metodologias/nueva`, `/metodologias/:id/editar` | Privadas. Formulario de metodología personalizada |
| `/metodologias/:id` | Privada. Detalle de una metodología |
| `/evaluaciones` | Privada. Elegir el aula |
| `/aulas/:classroomId/evaluaciones` | Privada. Evaluaciones del aula (`?vista=seguimiento` para el seguimiento) |
| `/evaluaciones/:assessmentId` | Privada. Detalle y tabla editable de calificaciones |
| `/estudiantes/:studentId/seguimiento` | Privada. Historial y evolución de un estudiante (por código) |
| `/guias`, `/seguimiento` | Privadas. "Módulo en preparación" |
| cualquier otra | 404 |

Sin sesión, una ruta privada lleva a `/login` y, al ingresar, se vuelve a la página pedida.

## Autenticación y sesión

Solo los docentes tienen cuenta; los estudiantes no inician sesión.

| Acción | Endpoint del backend |
|---|---|
| Registro (la confirmación de contraseña solo se valida en el navegador, no se envía) | `POST /api/auth/register` |
| Inicio de sesión | `POST /api/auth/login` |
| Verificar la sesión al cargar la página | `GET /api/auth/me` |
| Actualizar perfil (solo los campos cambiados) | `PATCH /api/teachers/me` |

**Token.** El backend entrega un JWT (8 h por defecto) que se envía como `Authorization: Bearer`;
no usa cookies. El frontend lo guarda en `sessionStorage` (se borra al cerrar la pestaña, útil en
computadoras compartidas de la escuela). Nunca se guarda la contraseña. El cierre de sesión es
local: borra el token (el backend no tiene endpoint de logout).

**Sesión expirada.** Se detecta de tres formas y en todas se vuelve a `/login` con el aviso
"Tu sesión expiró":
1. Al cargar, si el token guardado ya venció (se lee `exp` del JWT, sin consultar al backend).
2. Un temporizador cierra la sesión al llegar la hora de expiración.
3. Cualquier respuesta 401 a una petición que llevaba token.

Un 401 en el inicio de sesión (contraseña incorrecta) no se confunde con sesión expirada. Si el
servidor no responde al verificar la sesión, se muestra un error con "Reintentar" sin borrar el token.

**Idioma preferido.** Se guarda en el perfil. La interfaz sigue en español hasta contar con
traducciones validadas al Q'eqchi', K'iche', Mam y Kaqchikel.

## Selección académica (`/curriculo`)

Consulta de solo lectura del catálogo curricular (módulo B3 del backend):

| Paso | Endpoint |
|---|---|
| 1. Grados de primaria | `GET /api/grades?level=primaria` |
| 2. Materias del grado | `GET /api/subjects?grade=<id>` |
| 3. Temas de la materia en ese grado | `GET /api/topics?grade=<id>&subject=<id>&page=<n>&limit=100` (se recorren todas las páginas) |
| 4. Contenido del tema | `GET /api/topics/:id` |

- Cada paso consulta el backend solo con la selección anterior, así solo aparecen las materias
  del grado y los temas de esa materia y grado.
- La selección vive en la URL (`?grado=&materia=&tema=`): se puede recargar, compartir y deshacer
  con "Atrás". Ids que no existan en el catálogo se ignoran.
- La búsqueda de temas filtra en el navegador (sin tildes ni mayúsculas): el backend no tiene
  parámetro de búsqueda.
- Todo el contenido viene del backend; si falta descripción, competencias, indicadores o
  referencia curricular se indica su ausencia. Los registros con `isSample` /
  `containsSampleData` muestran el aviso "no proviene del CNB".
- Los selectores son grupos de radios accesibles (teclado y lector de pantalla).

## Aulas y estudiantes (`/aulas`)

| Acción | Endpoint (B4) |
|---|---|
| Listar aulas | `GET /api/classrooms?status=active\|archived\|all` |
| Crear / editar aula | `POST /api/classrooms`, `PATCH /api/classrooms/:id` (solo los campos que cambiaron) |
| Detalle | `GET /api/classrooms/:id` (404 si no existe o es de otro docente) |
| Archivar / restaurar aula | `DELETE /api/classrooms/:id` / `PATCH … { isActive: true }` |
| Listar estudiantes | `GET /api/classrooms/:id/students?status=…` |
| Agregar estudiante | `POST /api/classrooms/:id/students { studentCode }` |
| Editar código / reincorporar | `PATCH /api/students/:id { studentCode }` / `{ isActive: true }` |
| Retirar estudiante | `DELETE /api/students/:id` (archivado lógico) |

- Los estudiantes no tienen cuenta: el único dato que se pide y se envía es `studentCode`
  (se guarda en MAYÚSCULAS y es único dentro del aula, incluidos los retirados).
- Grado y materias del formulario de aula salen del catálogo B3 (`/grades`, `/subjects?grade=`):
  solo se ofrecen las materias del grado elegido.
- El backend no pagina ni busca aulas o estudiantes: la búsqueda y la paginación (9 aulas, 20
  estudiantes por página) se hacen en el navegador sobre la lista recibida.
- Archivar un aula y retirar a un estudiante piden confirmación. Nada se borra.
- Después de cada operación se vuelve a consultar la lista (sin perder búsqueda ni página) y se
  muestra un aviso. Si falla, el mensaje del backend aparece en el formulario o el diálogo.
- Los estudiantes solo se muestran en el detalle de un aula propia; sus códigos no van en la URL.

## Metodologías (`/metodologias`)

| Acción | Endpoint (B5) |
|---|---|
| Listar con filtros | `GET /api/methodologies?scope=all\|default\|mine&grade=&subject=&maxDuration=&learningPreferences=a,b` |
| Detalle | `GET /api/methodologies/:id` |
| Crear / editar (solo propias) | `POST /api/methodologies`, `PATCH /api/methodologies/:id` (solo los campos que cambiaron) |
| Archivar / restaurar (solo propias) | `DELETE /api/methodologies/:id` / `PATCH … { isActive: true }` |

- **Predeterminadas** (MINEDUC): etiqueta navy y borde sólido. Son de solo lectura: no muestran
  "Editar" y su ruta de edición no abre el formulario. Se ofrece "Crear una propia basada en esta",
  que copia el contenido y cita la fuente original.
- **Personalizadas**: etiqueta turquesa y borde discontinuo; solo las ve y edita su autor.
- Los filtros se aplican en el backend y quedan en la URL. Las etiquetas de preferencias vienen de
  `meta.learningPreferences`. Las preferencias se presentan como descriptivas: no se ordena ni se
  recomienda ninguna metodología como mejor.
- **Selección para la próxima guía**: "Usar en mi próxima guía" guarda en `sessionStorage`
  (`etamanik.guidePlanning`) solo `{ teacherId, methodology: { id, name, isDefault } }`. El módulo de
  guías leerá `useGuidePlanning().selectedMethodology.id` y lo enviará como `teachingMethodId`.
  La selección se borra al cerrar sesión o la pestaña, y al archivar esa metodología.

## Evaluaciones y seguimiento (`/evaluaciones`)

| Acción | Endpoint (B6) |
|---|---|
| Evaluaciones de un aula (filtros materia, tipo, fechas) | `GET /api/assessments?classroomId=…` |
| Crear evaluación | `POST /api/assessments` |
| Detalle + calificaciones + estudiantes sin nota | `GET /api/assessments/:id` |
| Registrar / corregir calificaciones | `POST /api/assessments/:id/results` |
| Seguimiento del aula | `GET /api/classrooms/:id/performance?subjectId=&threshold=` |
| Historial y evolución de un estudiante | `GET /api/students/:id/results`, `GET /api/students/:id/progress?threshold=` |

- **Calificación faltante ≠ cero.** Una celda vacía no se envía; se muestra "Sin calificación" con
  borde discontinuo. Un `0` es una nota válida (0 %). Una nota registrada se puede corregir (con
  motivo opcional; el backend conserva el valor anterior), pero no borrar: B6 no tiene ese endpoint.
- **Escala siempre visible:** "Escala: 0 a N" en listados y detalle, y "nota / máximo" en tablas.
- **Datos suficientes** (reglas de presentación, `src/utils/assessment.js`): estadísticas de un aula o
  de una evaluación con 3 o más calificaciones; promedio, tendencia e indicador de un estudiante con 2
  o más; gráficos con 2 o más puntos. Con menos, se explica en lugar de calcular.
- **Umbral de revisión configurable** (0–100 %): se envía como `threshold` y queda en la URL
  (`?umbral=`); sin valor se usa el predeterminado del backend. El indicador se llama "Revisión
  sugerida" y siempre va con la nota del backend: es apoyo al docente, no un diagnóstico.
- **Cronología:** gráficos e historial van de la evaluación más antigua a la más reciente. Las fechas
  se muestran en UTC (como las guarda el backend) para no correrlas un día.
- **Gráficos:** Recharts 3 (compatible con React 19), cargado bajo demanda. Cada gráfico tiene una
  descripción para lectores de pantalla y una tabla "Ver datos del gráfico".

## Cliente HTTP

`src/services/apiClient.js` es el único punto de acceso al backend:

- `baseURL` = `VITE_API_URL`.
- Agrega `Authorization: Bearer <token>` si hay sesión.
- Convierte los errores del backend (`{ success, message, errors: [{ field, message }] }`) a
  `{ status, message, fieldErrors, isNetworkError, isTimeout }`, sin modificar el contrato.
- Ante un 401 de una petición con token emite el evento `etamanik:unauthorized`, que cierra la sesión.

## Estados de carga, error y vacío

`useAsync` maneja el ciclo `loading → success | error` y `AsyncContent` muestra automáticamente
`LoadingState`, `ErrorState` (con botón Reintentar) o `EmptyState`. La aplicación no muestra datos
académicos de ejemplo: las secciones sin datos reales usan `EmptyState`.
