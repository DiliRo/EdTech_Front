import { apiClient } from './apiClient.js'

/**
 * Autenticación de docentes (módulo B2 del backend). Únicos endpoints usados:
 *   POST /api/auth/register  { firstName, lastName, email, password, preferredLanguage? } → { teacher, token }
 *   POST /api/auth/login     { email, password }                                          → { teacher, token }
 *   GET  /api/auth/me                                                                      → { teacher }
 * Solo los docentes tienen cuenta: no existe autenticación de estudiantes.
 */

/** Solo los campos que acepta el backend (rechaza cualquier otro, p. ej. la confirmación). */
export const register = async ({ firstName, lastName, email, password, preferredLanguage }) => {
    const { data } = await apiClient.post('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        ...(preferredLanguage ? { preferredLanguage } : {})
    })
    return data.data
}

export const login = async ({ email, password }) => {
    const { data } = await apiClient.post('/auth/login', { email: email.trim(), password })
    return data.data
}

/** Perfil del docente de la sesión actual. `token` permite consultarlo antes de guardarlo. */
export const getMe = async ({ token } = {}) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    const { data } = await apiClient.get('/auth/me', config)
    return data.data.teacher
}
