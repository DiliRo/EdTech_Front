import { AxiosError } from 'axios'
import { apiClient } from '../src/services/apiClient.js'

const originalAdapter = apiClient.defaults.adapter

/**
 * Reemplaza la red por respuestas simuladas con el formato del backend.
 * `routes`: { 'POST /auth/login': (request) => ({ status, body }) | Error }
 * Devuelve la lista de peticiones realizadas (método, url, parámetros, cuerpo y cabeceras).
 */
export const mockApi = (routes) => {
    const calls = []
    apiClient.defaults.adapter = async (config) => {
        const method = config.method.toUpperCase()
        const request = {
            method,
            url: config.url,
            params: { ...config.params },
            body: config.data ? JSON.parse(config.data) : undefined,
            headers: { ...config.headers }
        }
        calls.push(request)

        const handler = routes[`${method} ${config.url}`]
        if (!handler) throw new Error(`Ruta no simulada: ${method} ${config.url}`)
        const result = await handler(request)
        if (result instanceof Error) throw Object.assign(result, { config })

        const response = { data: result.body, status: result.status, statusText: '', headers: {}, config }
        const ok = config.validateStatus ? config.validateStatus(result.status) : result.status < 300
        if (ok) return response
        throw new AxiosError(`HTTP ${result.status}`, AxiosError.ERR_BAD_RESPONSE, config, null, response)
    }
    return calls
}

export const restoreApi = () => {
    apiClient.defaults.adapter = originalAdapter
}

/** Error de red (sin respuesta del servidor). */
export const networkError = () => new AxiosError('Network Error', AxiosError.ERR_NETWORK)

/** JWT con el formato del backend (solo se usa `exp`; la firma no se verifica en el cliente). */
export const fakeToken = ({ sub = 'teacher-1', expiresInSeconds = 8 * 3600 } = {}) => {
    const encode = (value) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
    const now = Math.floor(Date.now() / 1000)
    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub, iat: now, exp: now + expiresInSeconds })}.firma`
}

export const TEACHER = Object.freeze({
    id: 'teacher-1',
    firstName: 'Ana',
    lastName: 'Ixcot',
    email: 'ana.ixcot@escuela.edu.gt',
    preferredLanguage: 'es',
    createdAt: '2026-03-01T15:00:00.000Z',
    updatedAt: '2026-03-01T15:00:00.000Z'
})

export const ok = (data, message = 'OK') => ({ status: 200, body: { success: true, message, data } })
export const fail = (status, message, errors) => ({ status, body: { success: false, message, ...(errors ? { errors } : {}) } })
export const healthy = () => ok({ server: 'ok', database: 'connected' })
