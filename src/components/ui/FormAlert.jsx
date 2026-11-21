import { Alert, AlertDescription, AlertIcon } from '@chakra-ui/react'

/**
 * Mensaje general de un formulario (error, aviso o éxito). Usa role="alert" para que los
 * lectores de pantalla lo anuncien. Muestra solo mensajes pensados para el docente.
 */
export const FormAlert = ({ status = 'error', children }) => {
    if (!children) return null
    return (
        <Alert status={status} role={status === 'error' ? 'alert' : 'status'}>
            <AlertIcon />
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    )
}
