import { FormControl, FormErrorMessage, FormHelperText, FormLabel } from '@chakra-ui/react'

/**
 * Campo de formulario reutilizable: etiqueta, control, ayuda y error.
 * `children` es el control (Input, Select, PasswordInput…).
 */
export const FormField = ({ id, label, error, helper, isRequired = false, children }) => (
    <FormControl id={id} isInvalid={Boolean(error)} isRequired={isRequired}>
        <FormLabel>{label}</FormLabel>
        {children}
        {error ? (
            <FormErrorMessage>{error}</FormErrorMessage>
        ) : (
            helper && (
                <FormHelperText color="text.secondary" fontSize="sm">
                    {helper}
                </FormHelperText>
            )
        )}
    </FormControl>
)
