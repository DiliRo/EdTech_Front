import { useRef, useState } from 'react'
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    Stack,
    Text
} from '@chakra-ui/react'
import { FormAlert } from '../ui/FormAlert.jsx'
import { normalizeApiError } from '../../utils/apiError.js'

/**
 * Confirmación antes de una acción importante (archivar un aula, retirar a un estudiante).
 * El foco inicial queda en "Cancelar". Si la acción falla, el error se muestra dentro del diálogo
 * y el diálogo no se cierra.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => Promise<any>} props.onConfirm   acción; al resolver se cierra el diálogo
 * @param {string} props.title
 * @param {import('react').ReactNode} props.children  explicación de las consecuencias
 * @param {string} props.confirmLabel
 */
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, children, confirmLabel = 'Confirmar', loadingText = 'Procesando…' }) => {
    const cancelRef = useRef(null)
    const [isWorking, setWorking] = useState(false)
    const [error, setError] = useState(null)

    const close = () => {
        if (isWorking) return
        setError(null)
        onClose()
    }

    const confirm = async () => {
        setWorking(true)
        setError(null)
        try {
            await onConfirm()
            setWorking(false)
            onClose()
        } catch (err) {
            setError(normalizeApiError(err).message)
            setWorking(false)
        }
    }

    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={close} isCentered>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader>{title}</AlertDialogHeader>
                    <AlertDialogBody>
                        <Stack spacing={3}>
                            {typeof children === 'string' ? <Text>{children}</Text> : children}
                            <FormAlert>{error}</FormAlert>
                        </Stack>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} variant="secondary" onClick={close} isDisabled={isWorking}>
                            Cancelar
                        </Button>
                        <Button onClick={confirm} isLoading={isWorking} loadingText={loadingText}>
                            {confirmLabel}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}
