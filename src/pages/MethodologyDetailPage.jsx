import { useState } from 'react'
import { Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { FiArchive, FiArrowLeft, FiCopy, FiEdit2, FiInfo, FiRotateCcw } from 'react-icons/fi'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { FormAlert } from '../components/ui/FormAlert.jsx'
import { LoadingState } from '../components/feedback/LoadingState.jsx'
import { ErrorState } from '../components/feedback/ErrorState.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx'
import { MethodologyTypeTag } from '../components/methodologies/MethodologyTypeTag.jsx'
import { MethodologyContent, MethodologyFacts } from '../components/methodologies/MethodologyContent.jsx'
import { SelectMethodologyButton } from '../components/methodologies/SelectMethodologyButton.jsx'
import { SelectedMethodologyBanner } from '../components/methodologies/SelectedMethodologyBanner.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { useNotify } from '../hooks/useNotify.jsx'
import { useGuidePlanning } from '../hooks/useGuidePlanning.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { archiveMethodology, getLearningPreferences, getMethodology, restoreMethodology } from '../services/methodology.service.js'
import { normalizeApiError } from '../utils/apiError.js'
import { ROUTES } from '../utils/constants.js'

const BackLink = () => (
    <Link as={RouterLink} to={ROUTES.methodologies} display="inline-flex" alignItems="center" gap={1} fontWeight="semibold">
        <FiArrowLeft aria-hidden /> Volver a metodologías
    </Link>
)

/** Detalle: objetivos, pasos, actividades, materiales, fuente y acciones según el tipo. */
export const MethodologyDetailPage = () => {
    const { methodologyId } = useParams()
    const navigate = useNavigate()
    const notify = useNotify()
    const { isSelected, clearMethodology } = useGuidePlanning()
    const methodology = useQuery(methodologyId, () => getMethodology(methodologyId))
    const preferences = useQuery('learningPreferences', () => getLearningPreferences())
    const [isArchiving, setArchiving] = useState(false)
    const [isRestoring, setRestoring] = useState(false)
    useDocumentTitle(methodology.data?.name ?? 'Metodología')

    if (methodology.isLoading) return <LoadingState message="Cargando metodología…" />
    if (methodology.isError) {
        return (
            <Stack spacing={4}>
                <BackLink />
                {methodology.error?.status === 404 ? (
                    <EmptyState title="Metodología no encontrada" description="No existe o no está disponible para tu cuenta." />
                ) : (
                    <ErrorState title="No se pudo cargar la metodología" error={methodology.error} onRetry={methodology.run} />
                )}
            </Stack>
        )
    }

    const data = methodology.data
    if (!data) return null

    const archive = async () => {
        await archiveMethodology(data.id)
        if (isSelected(data.id)) clearMethodology() // una metodología archivada no se puede usar en guías nuevas
        notify(`Se archivó la metodología "${data.name}".`)
        navigate(ROUTES.methodologies, { replace: true })
    }

    const restore = async () => {
        setRestoring(true)
        try {
            await restoreMethodology(data.id)
            notify(`Se restauró la metodología "${data.name}".`)
            methodology.run()
        } catch (error) {
            notify(`No se pudo restaurar: ${normalizeApiError(error).message}`, 'error')
        } finally {
            setRestoring(false)
        }
    }

    return (
        <Stack spacing={6}>
            <BackLink />

            <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" gap={4} align={{ lg: 'flex-start' }}>
                <Stack spacing={2} maxW="3xl" align="flex-start">
                    <MethodologyTypeTag isDefault={data.isDefault} size="md" />
                    <Heading as="h1" size="lg">
                        {data.name}
                    </Heading>
                    <Text fontSize="md" whiteSpace="pre-line">
                        {data.description}
                    </Text>
                </Stack>
                <Flex gap={2} wrap="wrap" flexShrink={0}>
                    {data.isActive !== false && <SelectMethodologyButton methodology={data} size="md" />}
                    {data.isDefault ? (
                        <Button as={RouterLink} to={`${ROUTES.methodologyNew}?basadaEn=${encodeURIComponent(data.id)}`} variant="secondary" leftIcon={<FiCopy />}>
                            Crear una propia basada en esta
                        </Button>
                    ) : data.isActive === false ? (
                        <Button leftIcon={<FiRotateCcw />} onClick={restore} isLoading={isRestoring} loadingText="Restaurando…">
                            Restaurar
                        </Button>
                    ) : (
                        <>
                            <Button as={RouterLink} to={ROUTES.methodologyEdit(data.id)} variant="secondary" leftIcon={<FiEdit2 />}>
                                Editar
                            </Button>
                            <Button variant="ghost" leftIcon={<FiArchive />} onClick={() => setArchiving(true)}>
                                Archivar
                            </Button>
                        </>
                    )}
                </Flex>
            </Flex>

            {data.isDefault && (
                <FormAlert status="info">
                    Es una metodología predeterminada tomada de material del MINEDUC: no se puede editar. Si quieres ajustarla, crea una propia basada en
                    ella.
                </FormAlert>
            )}
            {data.isActive === false && <FormAlert status="warning">Esta metodología está archivada: no aparece en el listado ni se puede usar en guías nuevas.</FormAlert>}

            <SelectedMethodologyBanner />

            <SurfaceCard title="Datos generales" icon={FiInfo}>
                <MethodologyFacts methodology={data} preferences={preferences.data ?? []} />
            </SurfaceCard>

            <SurfaceCard>
                <MethodologyContent methodology={data} />
            </SurfaceCard>

            <ConfirmDialog
                isOpen={isArchiving}
                onClose={() => setArchiving(false)}
                onConfirm={archive}
                title="¿Archivar esta metodología?"
                confirmLabel="Archivar"
                loadingText="Archivando…"
            >
                <Text>
                    <strong>{data.name}</strong> dejará de aparecer en tu listado y no podrás usarla en guías nuevas.
                </Text>
                <Text>Las guías que ya la usan la conservan.</Text>
            </ConfirmDialog>
        </Stack>
    )
}

export default MethodologyDetailPage
