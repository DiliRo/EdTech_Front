/**
 * Lectura del token JWT que entrega el backend (POST /api/auth/login y /register).
 *
 * Solo se LEE la fecha de expiración (`exp`) para cerrar la sesión a tiempo. La firma la
 * verifica el backend en cada petición; el frontend nunca confía en el contenido del token
 * para dar permisos.
 */
const decodeBase64Url = (value) => {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
    return atob(base64)
}

/** Payload del token o `null` si no tiene formato JWT. */
export const decodeTokenPayload = (token) => {
    if (typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    try {
        const payload = JSON.parse(decodeBase64Url(parts[1]))
        return payload && typeof payload === 'object' ? payload : null
    } catch {
        return null
    }
}

/** Fecha de expiración en milisegundos, o `null` si el token no la indica. */
export const getTokenExpiration = (token) => {
    const exp = decodeTokenPayload(token)?.exp
    return Number.isFinite(exp) ? exp * 1000 : null
}

/**
 * true si el token no tiene formato válido o ya expiró. Se descuentan unos segundos de
 * margen para no enviar peticiones con un token a punto de vencer.
 */
export const isTokenExpired = (token, now = Date.now(), marginMs = 10_000) => {
    if (!decodeTokenPayload(token)) return true
    const expiration = getTokenExpiration(token)
    return expiration !== null && expiration - marginMs <= now
}
