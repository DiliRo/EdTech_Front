import { Badge, HStack, Stack, Text } from '@chakra-ui/react'
import { FiServer } from 'react-icons/fi'
import { SurfaceCard } from './ui/SurfaceCard.jsx'
import { AsyncContent } from './feedback/AsyncContent.jsx'
import { useApiHealth } from '../hooks/useApiHealth.js'

const STATUS_LABEL = {
    connected: 'Conectada',
    connecting: 'Conectando',
    disconnected: 'Desconectada',
    disconnecting: 'Desconectando',
    unreachable: 'Sin respuesta'
}

const StatusBadge = ({ ok, children }) => (
    <Badge
        px={2}
        py={0.5}
        borderRadius="md"
        bg={ok ? 'status.successBg' : 'status.errorBg'}
        color={ok ? 'status.success' : 'status.error'}
    >
        {children}
    </Badge>
)

/** Estado real del backend (GET /api/health): servidor y base de datos. */
export const ServerStatusCard = () => {
    const health = useApiHealth()

    return (
        <SurfaceCard title="Estado del servidor" icon={FiServer} description="Conexión con el backend de Etamanïk.">
            <AsyncContent
                state={health}
                loadingMessage="Comprobando conexión…"
                errorTitle="No se pudo contactar al servidor"
                emptyTitle="Sin información del servidor"
            >
                {(data) => (
                    <Stack spacing={2}>
                        <HStack justify="space-between">
                            <Text>Servidor</Text>
                            <StatusBadge ok={data.server === 'ok'}>{data.server === 'ok' ? 'En línea' : 'Con problemas'}</StatusBadge>
                        </HStack>
                        <HStack justify="space-between">
                            <Text>Base de datos</Text>
                            <StatusBadge ok={data.database === 'connected'}>{STATUS_LABEL[data.database] ?? data.database}</StatusBadge>
                        </HStack>
                    </Stack>
                )}
            </AsyncContent>
        </SurfaceCard>
    )
}
