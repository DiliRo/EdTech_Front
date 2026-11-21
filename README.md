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
│   ├── ui/                   # BrandLogo, PageHeader, SurfaceCard, FormField, PasswordInput…
│   └── ServerStatusCard.jsx  # estado real de GET /api/health
├── pages/                    # LoginPage, RegisterPage, DashboardPage, ComingSoonPage, NotFoundPage
├── services/
│   ├── apiClient.js          # Axios centralizado (VITE_API_URL, token Bearer, errores)
│   └── health.service.js
├── hooks/                    # useAsync, useApiHealth, useAuth, useDocumentTitle
├── context/                  # AuthContext (por ahora solo guarda/limpia el token)
└── utils/                    # constantes, env, tokenStorage, apiError, validation
tests/                        # Vitest + Testing Library
```

## Rutas

| Ruta | Página |
|---|---|
| `/` | Redirige a `/dashboard` |
| `/login`, `/register` | Inicio de sesión y registro (solo interfaz y validación) |
| `/dashboard` | Panel principal: estado del servidor y secciones vacías |
| `/aulas`, `/metodologias`, `/guias`, `/evaluaciones`, `/seguimiento` | "Módulo en preparación" |
| cualquier otra | 404 |

La protección de rutas privadas se agrega al conectar la autenticación.

## Cliente HTTP

`src/services/apiClient.js` es el único punto de acceso al backend:

- `baseURL` = `VITE_API_URL`.
- Agrega `Authorization: Bearer <token>` si hay sesión.
- Convierte los errores del backend (`{ success, message, errors: [{ field, message }] }`) a
  `{ status, message, fieldErrors, isNetworkError, isTimeout }`, sin modificar el contrato.
- Ante un 401 emite el evento `etamanik:unauthorized`, que limpia la sesión.

## Estados de carga, error y vacío

`useAsync` maneja el ciclo `loading → success | error` y `AsyncContent` muestra automáticamente
`LoadingState`, `ErrorState` (con botón Reintentar) o `EmptyState`. La aplicación no muestra datos
académicos de ejemplo: las secciones sin datos reales usan `EmptyState`.
