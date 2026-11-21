import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { tokenStorage } from '../utils/tokenStorage.js'
import { UNAUTHORIZED_EVENT } from '../services/apiClient.js'

/**
 * Contexto de sesión del docente.
 *
 * En este módulo solo guarda y limpia el token. El inicio de sesión, el registro y la carga
 * del perfil (POST /api/auth/login, /register y GET /api/auth/me) se conectan en el
 * siguiente módulo.
 */
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => tokenStorage.get())

    const saveSession = useCallback((newToken) => {
        tokenStorage.set(newToken)
        setToken(newToken)
    }, [])

    const clearSession = useCallback(() => {
        tokenStorage.clear()
        setToken(null)
    }, [])

    // Si el backend responde 401, la sesión ya no es válida
    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, clearSession)
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession)
    }, [clearSession])

    const value = useMemo(
        () => ({ token, isAuthenticated: Boolean(token), saveSession, clearSession }),
        [token, saveSession, clearSession]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
