import { createContext } from 'react'

/** Contexto de sesión del docente. El proveedor está en AuthContext.jsx. */
export const AuthContext = createContext(null)

/** Mensajes que se muestran en la pantalla de inicio de sesión después de cerrar la sesión. */
export const SESSION_NOTICES = Object.freeze({
    expired: { status: 'warning', message: 'Tu sesión expiró. Inicia sesión de nuevo.' },
    loggedOut: { status: 'success', message: 'Cerraste sesión correctamente.' }
})
