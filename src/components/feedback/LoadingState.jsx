import { Flex, Spinner, Text } from '@chakra-ui/react'

/** Indicador de carga accesible (role="status"). */
export const LoadingState = ({ message = 'Cargando…', minH = '160px' }) => (
    <Flex role="status" aria-live="polite" direction="column" align="center" justify="center" gap={3} minH={minH} py={6}>
        <Spinner size="lg" thickness="4px" speed="0.7s" emptyColor="turquoise.300" />
        <Text fontWeight="medium">{message}</Text>
    </Flex>
)
