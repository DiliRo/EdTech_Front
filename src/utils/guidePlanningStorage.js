/**
 * Selección de metodología para la próxima guía de clase.
 *
 * Se guarda en sessionStorage (igual que la sesión): se borra al cerrar la pestaña y al cerrar
 * sesión. Solo guarda el id (que es lo que recibirá el backend como `teachingMethodId`), el nombre
 * para mostrarlo y el docente dueño de la selección; el contenido se vuelve a consultar al usarla.
 */
const KEY = 'etamanik.guidePlanning'

export const guidePlanningStorage = {
    get() {
        try {
            const raw = window.sessionStorage.getItem(KEY)
            const value = raw ? JSON.parse(raw) : null
            return value && typeof value === 'object' ? value : null
        } catch {
            return null
        }
    },
    set(value) {
        try {
            window.sessionStorage.setItem(KEY, JSON.stringify(value))
        } catch {
            // Sin almacenamiento disponible la selección dura solo mientras la página esté abierta
        }
    },
    clear() {
        try {
            window.sessionStorage.removeItem(KEY)
        } catch {
            // nada que limpiar
        }
    }
}
