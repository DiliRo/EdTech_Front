import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button } from '@chakra-ui/react'
import { FiRefreshCw } from 'react-icons/fi'

/**
 * Mensaje de error con opción de reintentar. Recibe un error normalizado
 * (ver utils/apiError.js) o un texto.
 */
export const ErrorState = ({ error, title = 'No se pudo cargar la información', onRetry }) => {
    const message = typeof error === 'string' ? error : error?.message
    return (
        <Alert status="error" alignItems="flex-start" py={4} role="alert">
            <AlertIcon mt={1} />
            <Box flex="1">
                <AlertTitle>{title}</AlertTitle>
                {message && <AlertDescription display="block">{message}</AlertDescription>}
                {onRetry && (
                    <Button mt={3} size="sm" variant="secondary" leftIcon={<FiRefreshCw />} onClick={onRetry}>
                        Reintentar
                    </Button>
                )}
            </Box>
        </Alert>
    )
}
