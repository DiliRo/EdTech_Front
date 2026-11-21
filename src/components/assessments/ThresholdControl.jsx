import { useState } from 'react'
import { Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, InputGroup, InputRightAddon } from '@chakra-ui/react'
import { validateThreshold } from '../../utils/assessment.js'

/**
 * Umbral de revisión configurable (porcentaje de logro, 0–100). Se envía al backend como
 * `threshold`; sin valor propio se usa el predeterminado del backend.
 */
export const ThresholdControl = ({ value, defaultValue, onApply, onReset, isCustom }) => {
    const [text, setText] = useState(String(value ?? ''))
    const [error, setError] = useState(null)

    const apply = (event) => {
        event.preventDefault()
        const message = validateThreshold(text)
        setError(message)
        if (!message) onApply(Number(String(text).replace(',', '.')))
    }

    return (
        <Flex as="form" onSubmit={apply} gap={3} align="flex-start" wrap="wrap" noValidate>
            <FormControl isInvalid={Boolean(error)} maxW="260px">
                <FormLabel htmlFor="umbral">Umbral de revisión</FormLabel>
                <InputGroup>
                    <Input id="umbral" type="text" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} />
                    <InputRightAddon bg="bg.surfaceMuted" color="text.primary" borderColor="border.subtle">
                        %
                    </InputRightAddon>
                </InputGroup>
                {error ? (
                    <FormErrorMessage>{error}</FormErrorMessage>
                ) : (
                    <FormHelperText fontSize="xs">{isCustom ? 'Umbral personalizado.' : `Predeterminado: ${defaultValue ?? '—'} %.`}</FormHelperText>
                )}
            </FormControl>
            <Button type="submit" size="md" mt={{ base: 0, sm: 8 }}>
                Aplicar
            </Button>
            {isCustom && (
                <Button
                    variant="ghost"
                    mt={{ base: 0, sm: 8 }}
                    onClick={() => {
                        setError(null)
                        onReset()
                    }}
                >
                    Usar el predeterminado
                </Button>
            )}
        </Flex>
    )
}
