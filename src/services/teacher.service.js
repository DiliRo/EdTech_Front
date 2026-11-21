import { apiClient } from './apiClient.js'

/** Campos que el backend permite cambiar en PATCH /api/teachers/me (el correo y la contraseña no). */
export const EDITABLE_PROFILE_FIELDS = Object.freeze(['firstName', 'lastName', 'preferredLanguage'])

/**
 * PATCH /api/teachers/me. Envía solo los campos permitidos que se indiquen.
 * @returns {Promise<object>} docente actualizado
 */
export const updateMyProfile = async (changes) => {
    const body = Object.fromEntries(
        EDITABLE_PROFILE_FIELDS.filter((field) => changes[field] !== undefined).map((field) => [
            field,
            typeof changes[field] === 'string' ? changes[field].trim() : changes[field]
        ])
    )
    const { data } = await apiClient.patch('/teachers/me', body)
    return data.data.teacher
}
