import { SimpleGrid, Stack } from '@chakra-ui/react'
import { FiFileText } from 'react-icons/fi'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { ServerStatusCard } from '../components/ServerStatusCard.jsx'
import { DashboardClassrooms } from '../components/classrooms/DashboardClassrooms.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useAuth } from '../hooks/useAuth.js'

/**
 * Panel principal: estado del servidor y aulas activas del docente. La sección de guías se llenará
 * con datos del backend en su módulo (sin datos de ejemplo).
 */
export const DashboardPage = () => {
    useDocumentTitle('Inicio')
    const { teacher } = useAuth()

    return (
        <Stack spacing={6}>
            <PageHeader
                title={teacher ? `Hola, ${teacher.firstName}` : 'Panel principal'}
                description="Resumen de tu trabajo en Etamanïk."
            />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <ServerStatusCard />

                <DashboardClassrooms />

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
