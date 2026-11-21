import { Alert, AlertDescription, AlertIcon } from '@chakra-ui/react'

/** Aviso de que una acción todavía no está conectada con el backend. */
export const PendingFeatureNotice = ({ children }) => (
    <Alert status="info" role="status">
        <AlertIcon />
        <AlertDescription>{children}</AlertDescription>
    </Alert>
)
