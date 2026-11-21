/**
 * Variables de entorno de Vite (deben empezar con VITE_). Ver .env.example.
 * Se quitan las barras finales para que `${API_URL}/health` no quede con doble barra.
 */
const DEFAULT_API_URL = 'http://localhost:3000/api'

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000

if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
    console.warn(`VITE_API_URL no está definida; se usa ${DEFAULT_API_URL}. Copia .env.example a .env.`)
}
