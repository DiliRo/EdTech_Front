/**
 * Guarda el token de sesión del docente. El almacenamiento del navegador puede no estar
 * disponible (modo privado, permisos), por eso todo va en try/catch.
 */
const KEY = 'etamanik.token'

export const tokenStorage = {
    get() {
        try {
            return window.localStorage.getItem(KEY)
        } catch {
            return null
        }
    },
    set(token) {
        try {
            window.localStorage.setItem(KEY, token)
        } catch {
            // Sin almacenamiento la sesión dura solo mientras la página esté abierta
        }
    },
    clear() {
        try {
            window.localStorage.removeItem(KEY)
        } catch {
            // nada que limpiar
        }
    }
}
