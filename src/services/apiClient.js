import axios from 'axios'
import { API_URL, API_TIMEOUT_MS } from '../utils/env.js'
import { tokenStorage } from '../utils/tokenStorage.js'
import { normalizeApiError } from '../utils/apiError.js'

/** Evento que se emite cuando el backend responde 401 (sesión inválida o expirada). */
export const UNAUTHORIZED_EVENT = 'etamanik:unauthorized'

/**
 * Cliente HTTP centralizado. Todas las llamadas al backend pasan por aquí.
 *  - baseURL desde VITE_API_URL (p. ej. http://localhost:3000/api)
 *  - agrega `Authorization: Bearer <token>` si hay sesión
 *  - convierte los errores al formato de `normalizeApiError`
 */
export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: API_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' }
})

apiClient.interceptors.request.use((config) => {
    const token = tokenStorage.get()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const normalized = normalizeApiError(error)
        if (normalized.status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
        }
        return Promise.reject(normalized)
    }
)

/** Devuelve `data` de la respuesta: { success, message, data, meta? } tal como lo envía el backend. */
export const unwrap = (promise) => promise.then((response) => response.data)
