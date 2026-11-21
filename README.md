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
│   ├── ui/                   # BrandLogo, PageHeader, SurfaceCard, FormField, FormAlert, PasswordInput…
│   └── ServerStatusCard.jsx  # estado real de GET /api/health
├── pages/                    # Login, Register, Dashboard, Profile, ComingSoon, NotFound
├── services/
│   ├── apiClient.js          # Axios centralizado (VITE_API_URL, token Bearer, errores)
│   ├── auth.service.js       # POST /auth/register, POST /auth/login, GET /auth/me
│   ├── teacher.service.js    # PATCH /teachers/me
│   └── health.service.js
├── hooks/                    # useAsync, useApiHealth, useAuth, useFormState, useDocumentTitle
├── context/                  # AuthContext: sesión del docente
└── utils/                    # constantes, env, jwt, tokenStorage, apiError, validation
tests/                        # Vitest + Testing Library
```

## Rutas

| Ruta | Página |
|---|---|
| `/` | Redirige a `/dashboard` |
| `/login`, `/register` | Públicas: si ya hay sesión redirigen al panel |
| `/dashboard` | Privada. Panel principal |
| `/perfil` | Privada. Nombre, apellido e idioma preferido |
| `/aulas`, `/metodologias`, `/guias`, `/evaluaciones`, `/seguimiento` | Privadas. "Módulo en preparación" |
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
