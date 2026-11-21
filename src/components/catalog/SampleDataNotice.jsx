import { Alert, AlertDescription, AlertIcon, Badge } from '@chakra-ui/react'

/**
 * Aviso de datos de PRUEBA. El backend marca con `isSample` / `containsSampleData` el contenido
 * que no proviene del CNB; nunca debe presentarse como oficial.
 */
export const SampleDataNotice = ({ children = 'Este contenido es de prueba: no proviene del CNB y no debe usarse como contenido oficial.' }) => (
    <Alert status="warning" role="status">
        <AlertIcon />
        <AlertDescription>{children}</AlertDescription>
    </Alert>
)

/** Etiqueta pequeña para elementos de prueba dentro de las listas. */
export const SampleBadge = () => (
    <Badge bg="status.warningBg" color="status.warning" borderWidth="1px" borderColor="status.warning" fontSize="0.65rem" ml={2}>
        Prueba
    </Badge>
)
