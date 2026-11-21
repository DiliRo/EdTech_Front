import { apiClient } from './apiClient.js'

/**
 * GET /api/health del backend.
 * Responde 200 si servidor y base de datos funcionan, o 503 con el mismo formato si la base
 * de datos no está disponible. Ambos casos son respuestas válidas para mostrar el estado.
 *
 * @returns {Promise<{ healthy: boolean, server: string, database: string, timestamp: string }>}
 */
export const getHealth = async () => {
    const response = await apiClient.get('/health', {
        validateStatus: (status) => status === 200 || status === 503
    })
    const { success, data } = response.data
    return { healthy: success === true, ...data }
}
