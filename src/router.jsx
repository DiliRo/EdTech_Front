import { Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { CurriculumPage } from './pages/CurriculumPage.jsx'
import { ClassroomsPage } from './pages/ClassroomsPage.jsx'
import { ClassroomDetailPage } from './pages/ClassroomDetailPage.jsx'
import { MethodologiesPage } from './pages/MethodologiesPage.jsx'
import { MethodologyDetailPage } from './pages/MethodologyDetailPage.jsx'
import { MethodologyFormPage } from './pages/MethodologyFormPage.jsx'
import { AssessmentsHomePage } from './pages/AssessmentsHomePage.jsx'
import { ClassroomAssessmentsPage } from './pages/ClassroomAssessmentsPage.jsx'
import { AssessmentDetailPage } from './pages/AssessmentDetailPage.jsx'
import { StudentProgressPage } from './pages/StudentProgressPage.jsx'
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
            { path: ROUTES.curriculum, element: <CurriculumPage /> },
            { path: ROUTES.classrooms, element: <ClassroomsPage /> },
            { path: `${ROUTES.classrooms}/:classroomId`, element: <ClassroomDetailPage /> },
            { path: ROUTES.methodologies, element: <MethodologiesPage /> },
            { path: ROUTES.methodologyNew, element: <MethodologyFormPage /> },
            { path: `${ROUTES.methodologies}/:methodologyId`, element: <MethodologyDetailPage /> },
            { path: `${ROUTES.methodologies}/:methodologyId/editar`, element: <MethodologyFormPage /> },
            { path: ROUTES.assessments, element: <AssessmentsHomePage /> },
            { path: `${ROUTES.assessments}/:assessmentId`, element: <AssessmentDetailPage /> },
            { path: `${ROUTES.classrooms}/:classroomId/evaluaciones`, element: <ClassroomAssessmentsPage /> },
            { path: '/estudiantes/:studentId/seguimiento', element: <StudentProgressPage /> },
            { path: ROUTES.profile, element: <ProfilePage /> },
            ...NAV_ITEMS.filter((item) => !item.available).map((item) => ({
                path: item.to,
                element: <ComingSoonPage title={item.label} />
            }))
        ]
    },
    { path: '*', element: <NotFoundPage /> }
]
