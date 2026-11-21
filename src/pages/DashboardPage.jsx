import { SimpleGrid, Stack } from '@chakra-ui/react'
import { FiUsers, FiFileText } from 'react-icons/fi'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { ServerStatusCard } from '../components/ServerStatusCard.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

/**
 * Panel principal. Por ahora solo muestra el estado real del servidor; las secciones de aulas y
 * guías se llenarán con datos del backend en los siguientes módulos (sin datos de ejemplo).
 */
export const DashboardPage = () => {
    useDocumentTitle('Inicio')

    return (
        <Stack spacing={6}>
            <PageHeader title="Panel principal" description="Resumen de tu trabajo en Etamanïk." />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <ServerStatusCard />

                <SurfaceCard title="Mis aulas" icon={FiUsers}>
                    <EmptyState
                        title="Todavía no hay aulas para mostrar"
                        description="La gestión de aulas y estudiantes estará disponible en un próximo módulo."
                    />
                </SurfaceCard>

                <SurfaceCard title="Guías de clase recientes" icon={FiFileText} gridColumn={{ md: 'span 2' }}>
                    <EmptyState
                        title="Todavía no hay guías para mostrar"
                        description="Cuando generes o guardes guías de clase aparecerán aquí."
                    />
                </SurfaceCard>
            </SimpleGrid>
        </Stack>
    )
}

export default DashboardPage
