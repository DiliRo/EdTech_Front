/**
 * Variables de entorno de Vite (deben empezar con VITE_). Ver .env.example.
 * Se quitan las barras finales para que `${API_URL}/health` no quede con doble barra.
 *
 * Por defecto se usa el backend desplegado en Render. Para trabajar con un backend local,
 * define VITE_API_URL=http://localhost:3000/api en tu archivo .env.
 */
export const DEFAULT_API_URL = 'https://etemanik-backend.onrender.com/api'

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

// Render puede tardar en "despertar" el servicio gratuito: se da más margen a la primera petición
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 60000
