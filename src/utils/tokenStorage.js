/**
 * Almacenamiento del token de sesión del docente.
 *
 * Estrategia (adaptada al backend): el backend entrega un JWT que se envía en la cabecera
 * `Authorization: Bearer <token>` (no usa cookies) y que expira según JWT_EXPIRES_IN (8 h por
 * defecto). Por eso:
 *  - se guarda en `sessionStorage`, no en `localStorage`: se borra al cerrar la pestaña y no
 *    queda guardado indefinidamente en el equipo (importante en computadoras compartidas de
 *    escuelas);
 *  - nunca se guarda la contraseña ni otros datos del docente;
 *  - el token se descarta al expirar (ver AuthContext).
 *
 * El almacenamiento puede no estar disponible (modo privado, permisos): todo va en try/catch.
 */
const KEY = 'etamanik.session'

const storage = () => {
    try {
        return window.sessionStorage
    } catch {
        return null
    }
}

export const tokenStorage = {
    get() {
        try {
            return storage()?.getItem(KEY) ?? null
        } catch {
            return null
        }
    },
    set(token) {
        try {
            storage()?.setItem(KEY, token)
        } catch {
            // Sin almacenamiento la sesión dura solo mientras la página esté abierta
        }
    },
    clear() {
        try {
            storage()?.removeItem(KEY)
        } catch {
            // nada que limpiar
        }
    }
}
