import { Box, Button, Flex, Stack } from '@chakra-ui/react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { LoadingState } from '../feedback/LoadingState.jsx'
import { ErrorState } from '../feedback/ErrorState.jsx'
import { ROUTES } from '../../utils/constants.js'

/** Pantalla completa sobre el fondo turquesa para los estados de verificación. */
export const FullPageStatus = ({ children }) => (
    <Flex minH="100vh" bg="bg.app" align="center" justify="center" px={4}>
        <Box w="full" maxW="md">
            {children}
        </Box>
    </Flex>
)

/**
 * Solo deja pasar a docentes con sesión verificada. Sin sesión redirige al inicio de sesión
 * recordando la página pedida, para volver a ella después de ingresar.
 */
export const ProtectedRoute = ({ children }) => {
    const { status, error, retry, logout } = useAuth()
    const location = useLocation()

    if (status === 'checking') {
        return (
            <FullPageStatus>
                <LoadingState message="Verificando tu sesión…" />
            </FullPageStatus>
        )
    }

    if (status === 'error') {
        return (
            <FullPageStatus>
                <Stack spacing={3}>
                    <ErrorState title="No se pudo verificar tu sesión" error={error} onRetry={retry} />
                    <Button variant="secondary" onClick={logout}>
                        Cerrar sesión
                    </Button>
                </Stack>
            </FullPageStatus>
        )
    }

    if (status !== 'authenticated') {
        return <Navigate to={ROUTES.login} replace state={{ from: location }} />
    }

    return children
}
