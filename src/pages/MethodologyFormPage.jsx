import { Link, Stack } from '@chakra-ui/react'
import { FiArrowLeft, FiLock } from 'react-icons/fi'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { LoadingState } from '../components/feedback/LoadingState.jsx'
import { ErrorState } from '../components/feedback/ErrorState.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { MethodologyForm } from '../components/methodologies/MethodologyForm.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { useNotify } from '../hooks/useNotify.jsx'
import { useGuidePlanning } from '../hooks/useGuidePlanning.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { createMethodology, getLearningPreferences, getMethodology, updateMethodology } from '../services/methodology.service.js'
import { adaptFromDefault } from '../utils/methodology.js'
import { ROUTES } from '../utils/constants.js'

/**
 * Crear (/metodologias/nueva) o editar (/metodologias/:id/editar) una metodología personalizada.
 * Con ?basadaEn=<id> el formulario empieza con el contenido de una predeterminada, citando su origen.
 * Las predeterminadas nunca se editan.
 */
export const MethodologyFormPage = () => {
    const { methodologyId } = useParams()
    const [params] = useSearchParams()
    const baseId = methodologyId ? null : params.get('basadaEn')
    const navigate = useNavigate()
    const notify = useNotify()
    const { isSelected, selectMethodology } = useGuidePlanning()
    const isEdit = Boolean(methodologyId)
    useDocumentTitle(isEdit ? 'Editar metodología' : 'Nueva metodología')

    const preferences = useQuery('learningPreferences', () => getLearningPreferences())
    const sourceId = methodologyId ?? baseId
    const source = useQuery(sourceId, () => getMethodology(sourceId))

    const back = isEdit ? ROUTES.methodologyDetail(methodologyId) : ROUTES.methodologies
    const header = (
        <>
            <Link as={RouterLink} to={back} display="inline-flex" alignItems="center" gap={1} fontWeight="semibold">
                <FiArrowLeft aria-hidden /> {isEdit ? 'Volver a la metodología' : 'Volver a metodologías'}
            </Link>
            <PageHeader
                title={isEdit ? 'Editar metodología' : 'Nueva metodología'}
                description="Tus metodologías solo las ves tú. Indica al menos un nombre y una descripción; lo demás es opcional."
            />
        </>
    )

    if (preferences.isLoading || source.isLoading) return <LoadingState message="Preparando el formulario…" />
    const loadError = preferences.isError ? preferences : source.isError ? source : null
    if (loadError) {
        return (
            <Stack spacing={4}>
                {header}
                {loadError.error?.status === 404 ? (
                    <EmptyState title="Metodología no encontrada" description="No existe o no está disponible para tu cuenta." />
                ) : (
                    <ErrorState error={loadError.error} onRetry={loadError.run} />
                )}
            </Stack>
        )
    }

    if (isEdit && source.data?.isDefault) {
        return (
            <Stack spacing={4}>
                {header}
                <EmptyState
                    icon={FiLock}
                    title="Las metodologías predeterminadas no se pueden editar"
                    description="Puedes crear una propia basada en esta y ajustarla a tu grupo."
                />
            </Stack>
        )
    }

    const submit = async (payload, changes) => {
        const saved = isEdit ? await updateMethodology(methodologyId, changes) : await createMethodology(payload)
        // Si estaba seleccionada para la guía, se actualiza el nombre guardado
        if (isSelected(saved.id)) selectMethodology(saved)
        notify(isEdit ? `Se guardaron los cambios de "${saved.name}".` : `Se creó la metodología "${saved.name}".`)
        navigate(ROUTES.methodologyDetail(saved.id), { replace: true })
    }

    return (
        <Stack spacing={4}>
            {header}
            <MethodologyForm
                key={sourceId ?? 'new'}
                methodology={isEdit ? source.data : null}
                initialValues={!isEdit && source.data ? adaptFromDefault(source.data) : undefined}
                preferences={preferences.data ?? []}
                onSubmit={submit}
                onCancel={() => navigate(back)}
            />
        </Stack>
    )
}

export default MethodologyFormPage
