import { useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import { FormAlert } from '../components/ui/FormAlert.jsx'

/** Avisos breves después de una operación (con los colores del tema, sin fondos blancos). */
export const useNotify = () => {
    const toast = useToast()
    return useCallback(
        (message, status = 'success') =>
            toast({
                position: 'top',
                duration: status === 'error' ? 7000 : 4000,
                render: () => (
                    <FormAlert status={status}>{message}</FormAlert>
                )
            }),
        [toast]
    )
}
