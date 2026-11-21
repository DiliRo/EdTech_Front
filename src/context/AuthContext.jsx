import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext, SESSION_NOTICES } from './authContext.js'
import { tokenStorage } from '../utils/tokenStorage.js'
import { getTokenExpiration, isTokenExpired } from '../utils/jwt.js'
import { UNAUTHORIZED_EVENT } from '../services/apiClient.js'
import * as authService from '../services/auth.service.js'
import { updateMyProfile } from '../services/teacher.service.js'

/** El temporizador de setTimeout no admite más de ~24,8 días. */
const MAX_TIMEOUT_MS = 2_147_483_647

/**
 * Estado inicial calculado al cargar la página, sin efectos: si el token guardado ya
 * expiró se descarta de inmediato y se avisa al docente.
 */
const initialState = () => {
    const token = tokenStorage.get()
    if (!token) return { status: 'unauthenticated', teacher: null, error: null, notice: null }
    if (isTokenExpired(token)) {
        tokenStorage.clear()
        return { status: 'unauthenticated', teacher: null, error: null, notice: SESSION_NOTICES.expired }
    }
    return { status: 'checking', teacher: null, error: null, notice: null }
}

/**
 * Sesión del docente.
 *
 * - Al cargar, si hay un token válido consulta GET /api/auth/me para obtener el perfil.
 * - `login` y `register` guardan el token que devuelve el backend (nunca la contraseña).
 * - La sesión se cierra sola cuando el token expira o cuando el backend lo rechaza (401).
 *
 * status: 'checking' | 'authenticated' | 'unauthenticated' | 'error'
 *   ('error' = no se pudo verificar la sesión por un problema de red o del servidor)
 */
export const AuthProvider = ({ children }) => {
    const [state, setState] = useState(initialState)
    const [token, setToken] = useState(() => tokenStorage.get())

    const endSession = useCallback((notice = null) => {
        tokenStorage.clear()
        setToken(null)
        setState({ status: 'unauthenticated', teacher: null, error: null, notice })
    }, [])

    const startSession = useCallback(({ token: newToken, teacher }) => {
        tokenStorage.set(newToken)
        setToken(newToken)
        setState({ status: 'authenticated', teacher, error: null, notice: null })
        return teacher
    }, [])

    /** Consulta el perfil con el token guardado. Solo actualiza el estado al terminar. */
    const loadProfile = useCallback(
        () =>
            authService.getMe().then(
                (teacher) => setState({ status: 'authenticated', teacher, error: null, notice: null }),
                (error) => {
                    if (error?.status === 401) return endSession(SESSION_NOTICES.expired)
                    setState((prev) => ({ ...prev, status: 'error', error }))
                }
            ),
        [endSession]
    )

    // Al cargar la página con un token guardado se verifica con el backend
    const [initialStatus] = useState(state.status)
    useEffect(() => {
        if (initialStatus === 'checking') loadProfile()
    }, [initialStatus, loadProfile])

    /** Reintenta verificar la sesión (después de un error de red). */
    const retry = useCallback(() => {
        setState((prev) => ({ ...prev, status: 'checking', error: null }))
        return loadProfile()
    }, [loadProfile])

    // El backend rechazó el token en cualquier petición: la sesión expiró o ya no es válida
    useEffect(() => {
        const onUnauthorized = () => endSession(SESSION_NOTICES.expired)
        window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    }, [endSession])

    // Cierre automático al llegar la hora de expiración del token
    useEffect(() => {
        if (!token) return undefined
        const expiration = getTokenExpiration(token)
        if (expiration === null) return undefined
        const delay = expiration - Date.now()
        if (delay > MAX_TIMEOUT_MS) return undefined
        const timer = setTimeout(() => endSession(SESSION_NOTICES.expired), Math.max(delay, 0))
        return () => clearTimeout(timer)
    }, [token, endSession])

    const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession])

    const register = useCallback(async (data) => startSession(await authService.register(data)), [startSession])

    const logout = useCallback(() => endSession(SESSION_NOTICES.loggedOut), [endSession])

    const updateProfile = useCallback(async (changes) => {
        const teacher = await updateMyProfile(changes)
        setState((prev) => ({ ...prev, teacher }))
        return teacher
    }, [])

    const clearNotice = useCallback(() => setState((prev) => (prev.notice ? { ...prev, notice: null } : prev)), [])

    const value = useMemo(
        () => ({
            ...state,
            isAuthenticated: state.status === 'authenticated',
            isChecking: state.status === 'checking',
            login,
            register,
            logout,
            updateProfile,
            retry,
            clearNotice
        }),
        [state, login, register, logout, updateProfile, retry, clearNotice]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
