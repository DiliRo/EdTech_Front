import { Stack } from '@chakra-ui/react'
import { FiTool } from 'react-icons/fi'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

/** Página para los módulos del menú que todavía no tienen interfaz. */
export const ComingSoonPage = ({ title }) => {
    useDocumentTitle(title)
    return (
        <Stack spacing={6}>
            <PageHeader title={title} />
            <EmptyState
                icon={FiTool}
                title="Módulo en preparación"
                description={`La sección "${title}" se habilitará en una próxima versión.`}
            />
        </Stack>
    )
}

export default ComingSoonPage
