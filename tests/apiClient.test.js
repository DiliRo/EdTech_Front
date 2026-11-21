import { describe, it, expect, vi, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { apiClient, UNAUTHORIZED_EVENT } from '../src/services/apiClient.js'
import { getHealth } from '../src/services/health.service.js'
import { normalizeApiError } from '../src/utils/apiError.js'
import { tokenStorage } from '../src/utils/tokenStorage.js'

const originalAdapter = apiClient.defaults.adapter

/** Reemplaza la red por una función que recibe la configuración de la petición. */
const mockAdapter = (handler) => {
    const calls = []
    apiClient.defaults.adapter = async (config) => {
        calls.push(config)
        return handler(config)
    }
    return calls
}

const reply = (config, status, data) => {
    const response = { data, status, statusText: String(status), headers: {}, config }
    if (status >= 200 && status < 300) return response
    if (config.validateStatus?.(status)) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_RESPONSE, config, null, response)
}

afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
})

describe('Cliente HTTP', () => {
    it('usa VITE_API_URL como base', async () => {
        const calls = mockAdapter((config) => reply(config, 200, { success: true }))
        await apiClient.get('/health')
        expect(apiClient.defaults.baseURL).toBe('http://api.test/api')
        expect(calls[0].url).toBe('/health')
    })

    it('agrega el token como Bearer solo si hay sesión', async () => {
        const calls = mockAdapter((config) => reply(config, 200, {}))
        await apiClient.get('/x')
        expect(calls[0].headers.Authorization).toBeUndefined()

        tokenStorage.set('token-123')
        await apiClient.get('/x')
        expect(calls[1].headers.Authorization).toBe('Bearer token-123')
    })

    it('convierte los errores del backend sin cambiar su contrato', async () => {
        mockAdapter((config) => reply(config, 400, {
            success: false,
            message: 'Errores de validación',
            errors: [{ field: 'email', message: 'El correo no es válido' }, { field: 'email', message: 'otro' }]
        }))
        await expect(apiClient.post('/auth/register', {})).rejects.toMatchObject({
            isApiError: true,
            status: 400,
            message: 'Errores de validación',
            fieldErrors: { email: 'El correo no es válido' },
            isNetworkError: false
        })
    })

    it('emite un evento de sesión inválida cuando el backend responde 401', async () => {
        mockAdapter((config) => reply(config, 401, { success: false, message: 'Debes iniciar sesión' }))
        const listener = vi.fn()
        window.addEventListener(UNAUTHORIZED_EVENT, listener)
        await expect(apiClient.get('/auth/me')).rejects.toMatchObject({ status: 401 })
        window.removeEventListener(UNAUTHORIZED_EVENT, listener)
        expect(listener).toHaveBeenCalledTimes(1)
    })
})

describe('normalizeApiError', () => {
    it('sin respuesta del servidor: error de red con mensaje claro', () => {
        const error = normalizeApiError(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
        expect(error).toMatchObject({ isNetworkError: true, status: null })
        expect(error.message).toMatch(/No se pudo conectar/)
    })

    it('tiempo de espera agotado', () => {
        const error = normalizeApiError(new AxiosError('timeout', 'ECONNABORTED'))
        expect(error).toMatchObject({ isTimeout: true, isNetworkError: false })
        expect(error.message).toMatch(/tardó demasiado/)
    })

    it('respuesta sin mensaje: texto genérico', () => {
        const error = normalizeApiError({ response: { status: 500, data: {} } })
        expect(error.message).toMatch(/error inesperado/)
    })

    it('no vuelve a procesar un error ya normalizado', () => {
        const once = normalizeApiError({ response: { status: 404, data: { message: 'x' } } })
        expect(normalizeApiError(once)).toBe(once)
    })
})

describe('getHealth (GET /api/health)', () => {
    it('200: servidor y base de datos en funcionamiento', async () => {
        mockAdapter((config) => reply(config, 200, { success: true, data: { server: 'ok', database: 'connected' } }))
        await expect(getHealth()).resolves.toMatchObject({ healthy: true, database: 'connected' })
    })

    it('503 también es una respuesta válida: base de datos no disponible', async () => {
        mockAdapter((config) => reply(config, 503, { success: false, data: { server: 'ok', database: 'disconnected' } }))
        await expect(getHealth()).resolves.toMatchObject({ healthy: false, database: 'disconnected' })
    })

    it('otros errores se rechazan normalizados', async () => {
        mockAdapter((config) => reply(config, 500, { success: false, message: 'Error interno del servidor' }))
        await expect(getHealth()).rejects.toMatchObject({ status: 500, message: 'Error interno del servidor' })
    })
})
