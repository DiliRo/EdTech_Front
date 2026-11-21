import { useMemo } from 'react'
import { Button, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { FiFilter, FiPlus } from 'react-icons/fi'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { AsyncContent } from '../components/feedback/AsyncContent.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { MethodologyFilters } from '../components/methodologies/MethodologyFilters.jsx'
import { MethodologyCard } from '../components/methodologies/MethodologyCard.jsx'
import { SelectedMethodologyBanner } from '../components/methodologies/SelectedMethodologyBanner.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getLearningPreferences, listMethodologies } from '../services/methodology.service.js'
import { METHOD_FILTER_PARAMS as P, SCOPE_OPTIONS } from '../utils/methodology.js'
import { ROUTES } from '../utils/constants.js'

const readFilters = (params, preferenceCodes) => {
    const scope = params.get(P.scope)
    return {
        scope: SCOPE_OPTIONS.some((o) => o.value === scope) ? scope : 'all',
        grade: params.get(P.grade) ?? '',
        subject: params.get(P.subject) ?? '',
        maxDuration: params.get(P.maxDuration) ?? '',
        // Solo códigos que existen en el catálogo del backend
        learningPreferences: (params.get(P.learningPreferences) ?? '').split(',').filter((code) => preferenceCodes.includes(code))
    }
}

const writeFilters = (filters) =>
    Object.fromEntries(
        [
            [P.scope, filters.scope !== 'all' ? filters.scope : ''],
            [P.grade, filters.grade],
            [P.subject, filters.subject],
            [P.maxDuration, filters.maxDuration],
            [P.learningPreferences, filters.learningPreferences.join(',')]
        ].filter(([, value]) => value)
    )

/**
 * Metodologías disponibles para el docente: predeterminadas (MINEDUC) y propias.
 * Los filtros se envían al backend y quedan en la URL.
 */
export const MethodologiesPage = () => {
    useDocumentTitle('Metodologías')
    const [params, setParams] = useSearchParams()
    const preferencesQuery = useQuery('learningPreferences', () => getLearningPreferences())
    const preferences = useMemo(() => preferencesQuery.data ?? [], [preferencesQuery.data])
    const filters = readFilters(params, preferences.map((p) => p.code))

    const key = JSON.stringify(filters)
    const methods = useQuery(preferencesQuery.isLoading ? null : key, () =>
        listMethodologies({ ...filters, maxDuration: filters.maxDuration ? Number(filters.maxDuration) : undefined })
    )

    const updateFilters = (changes) => setParams(writeFilters({ ...filters, ...changes }), { replace: true })
    const clearFilters = () => setParams({}, { replace: true })
    // Filtros de contenido (el tipo no cuenta: "Mis metodologías" vacío es otro mensaje)
    const hasContentFilters = Boolean(filters.grade || filters.subject || filters.maxDuration || filters.learningPreferences.length)

    return (
        <Stack spacing={6}>
            <PageHeader
                title="Metodologías"
                description="Estrategias de enseñanza para planificar tus clases: las predeterminadas del MINEDUC y las que tú creas."
                actions={
                    <Button as={RouterLink} to={ROUTES.methodologyNew} leftIcon={<FiPlus />}>
                        Nueva metodología
                    </Button>
                }
            />

            <Text bg="bg.surfaceMuted" px={4} py={3} borderRadius="lg" color="text.secondary">
                Ninguna metodología es mejor en todos los casos. Elige la que se ajuste a tu grupo, al tema y a tu contexto, y compara cómo te
                funciona en el aula.
            </Text>

            <SelectedMethodologyBanner />

            <SurfaceCard title="Filtros" icon={FiFilter}>
                <MethodologyFilters filters={filters} onChange={updateFilters} onClear={clearFilters} preferences={preferences} />
            </SurfaceCard>

            <AsyncContent state={methods} isEmpty={() => false} loadingMessage="Cargando metodologías…" errorTitle="No se pudieron cargar las metodologías">
                {(data) =>
                    data.methodologies.length === 0 ? (
                        hasContentFilters ? (
                            <EmptyState
                                icon={FiFilter}
                                title="Ninguna metodología coincide con los filtros"
                                description="Prueba con menos filtros o con otro tiempo disponible."
                                action={
                                    <Button mt={2} size="sm" onClick={clearFilters}>
                                        Limpiar filtros
                                    </Button>
                                }
                            />
                        ) : filters.scope === 'mine' ? (
                            <EmptyState
                                title="Aún no has creado metodologías"
                                description="Registra tus propias estrategias para usarlas en tus guías de clase."
                                action={
                                    <Button as={RouterLink} to={ROUTES.methodologyNew} mt={2} size="sm" leftIcon={<FiPlus />}>
                                        Crear metodología
                                    </Button>
                                }
                            />
                        ) : (
                            <EmptyState title="No hay metodologías disponibles" description="Todavía no se han cargado metodologías en la plataforma. Puedes crear las tuyas." />
                        )
                    ) : (
                        <Stack spacing={3}>
                            <Text fontSize="sm" aria-live="polite">
                                {data.methodologies.length} {data.methodologies.length === 1 ? 'metodología' : 'metodologías'}
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
                                {data.methodologies.map((methodology) => (
                                    <MethodologyCard key={methodology.id} methodology={methodology} preferences={preferences} />
                                ))}
                            </SimpleGrid>
                        </Stack>
                    )
                }
            </AsyncContent>
        </Stack>
    )
}

export default MethodologiesPage
