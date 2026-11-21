import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { LoadingState } from '../feedback/LoadingState.jsx'
import { FullPageStatus } from './ProtectedRoute.jsx'
import { ROUTES } from '../../utils/constants.js'

/** Inicio de sesión y registro: si ya hay sesión, lleva al panel (o a la página que se pedía). */
export const PublicOnlyRoute = ({ children }) => {
    const { status } = useAuth()
    const location = useLocation()

    if (status === 'checking') {
        return (
            <FullPageStatus>
                <LoadingState message="Verificando tu sesión…" />
            </FullPageStatus>
        )
    }

    if (status === 'authenticated') {
        const target = location.state?.from?.pathname ?? ROUTES.dashboard
        return <Navigate to={target} replace />
    }

    return children
}
