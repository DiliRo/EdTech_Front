import { Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { ComingSoonPage } from './pages/ComingSoonPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { NAV_ITEMS } from './components/layout/navigation.js'
import { ROUTES } from './utils/constants.js'

/**
 * Rutas de la aplicación (React Router 7).
 *  - Públicas (solo sin sesión): inicio de sesión y registro.
 *  - Privadas (requieren sesión verificada con GET /api/auth/me): todo el panel docente.
 */
export const routes = [
    { path: ROUTES.home, element: <Navigate to={ROUTES.dashboard} replace /> },
    {
        element: (
            <PublicOnlyRoute>
                <AuthLayout />
            </PublicOnlyRoute>
        ),
        children: [
            { path: ROUTES.login, element: <LoginPage /> },
            { path: ROUTES.register, element: <RegisterPage /> }
        ]
    },
    {
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: ROUTES.dashboard, element: <DashboardPage /> },
            { path: ROUTES.profile, element: <ProfilePage /> },
            ...NAV_ITEMS.filter((item) => !item.available).map((item) => ({
                path: item.to,
                element: <ComingSoonPage title={item.label} />
            }))
        ]
    },
    { path: '*', element: <NotFoundPage /> }
]
