import { Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ComingSoonPage } from './pages/ComingSoonPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { NAV_ITEMS } from './components/layout/navigation.js'
import { ROUTES } from './utils/constants.js'

/**
 * Rutas de la aplicación (formato de objetos de React Router 7).
 * La protección de rutas privadas se agrega cuando se conecte la autenticación.
 */
export const routes = [
    { path: ROUTES.home, element: <Navigate to={ROUTES.dashboard} replace /> },
    {
        element: <AuthLayout />,
        children: [
            { path: ROUTES.login, element: <LoginPage /> },
            { path: ROUTES.register, element: <RegisterPage /> }
        ]
    },
    {
        element: <MainLayout />,
        children: [
            { path: ROUTES.dashboard, element: <DashboardPage /> },
            ...NAV_ITEMS.filter((item) => !item.available).map((item) => ({
                path: item.to,
                element: <ComingSoonPage title={item.label} />
            }))
        ]
    },
    { path: '*', element: <NotFoundPage /> }
]
