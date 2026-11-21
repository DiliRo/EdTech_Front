/**
 * Validaciones de formulario en el cliente. Replican las reglas visibles del backend para
 * avisar antes de enviar; el backend sigue siendo quien decide.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME = /^[\p{L}\p{M}'’ -]+$/u

export const validateEmail = (value) => {
    if (!value?.trim()) return 'El correo es obligatorio'
    if (!EMAIL.test(value.trim())) return 'El correo no es válido'
    return null
}

export const validateRequired = (value, label) => (value?.trim() ? null : `${label} es obligatorio`)

export const validateName = (value, label) => {
    const required = validateRequired(value, label)
    if (required) return required
    if (value.trim().length > 60) return `${label} no puede superar 60 caracteres`
    if (!NAME.test(value.trim())) return `${label} solo puede contener letras, espacios, apóstrofos o guiones`
    return null
}

/** Misma regla que el backend: 8+ caracteres, mayúscula, minúscula y número. */
export const validateNewPassword = (value) => {
    if (!value) return 'La contraseña es obligatoria'
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (!/[a-zà-ÿñ]/.test(value)) return 'La contraseña debe incluir una letra minúscula'
    if (!/[A-ZÀ-ÝÑ]/.test(value)) return 'La contraseña debe incluir una letra mayúscula'
    if (!/\d/.test(value)) return 'La contraseña debe incluir un número'
    return null
}

/** Devuelve solo los campos con error. */
export const collectErrors = (validators) =>
    Object.fromEntries(Object.entries(validators).filter(([, message]) => Boolean(message)))
