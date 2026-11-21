import { useState } from 'react'
import { Button, Flex, FormControl, FormLabel, Input, Link, Select, SimpleGrid, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VisuallyHidden } from '@chakra-ui/react'
import { FiArrowLeft, FiClipboard, FiPlus, FiTrendingUp } from 'react-icons/fi'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { FormAlert } from '../components/ui/FormAlert.jsx'
import { AsyncContent } from '../components/feedback/AsyncContent.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { LoadingState } from '../components/feedback/LoadingState.jsx'
import { ErrorState } from '../components/feedback/ErrorState.jsx'
import { SegmentedControl } from '../components/common/SegmentedControl.jsx'
import { Pagination } from '../components/common/Pagination.jsx'
import { AssessmentFormModal } from '../components/assessments/AssessmentFormModal.jsx'
import { ClassroomPerformance } from '../components/assessments/ClassroomPerformance.jsx'
import { ScaleBadge } from '../components/assessments/Indicators.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { usePagination } from '../hooks/usePagination.js'
import { useNotify } from '../hooks/useNotify.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getClassroom } from '../services/classroom.service.js'
import { listAssessments } from '../services/assessment.service.js'
import { ASSESSMENT_TYPES, assessmentTypeLabel, formatAssessmentDate, validateThreshold } from '../utils/assessment.js'
import { classroomGradeLabel } from '../utils/classroom.js'
import { ROUTES } from '../utils/constants.js'

const VIEWS = [
    { value: 'evaluaciones', label: 'Evaluaciones' },
    { value: 'seguimiento', label: 'Seguimiento del aula' }
]
const PAGE_SIZE = 15

const AssessmentList = ({ classroom, onCreate }) => {
    const [filters, setFilters] = useState({ subjectId: '', assessmentType: '', from: '', to: '' })
    const key = `${classroom.id}:${JSON.stringify(filters)}`
    const assessments = useQuery(key, () => listAssessments({ classroomId: classroom.id, ...filters }))
    const pagination = usePagination(assessments.data ?? [], PAGE_SIZE)
    const hasFilters = Object.values(filters).some(Boolean)
    const change = (name) => (event) => {
        setFilters((prev) => ({ ...prev, [name]: event.target.value }))
        pagination.setPage(1)
    }

    return (
        <Stack spacing={5}>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
                <FormControl>
                    <FormLabel htmlFor="filtro-materia">Materia</FormLabel>
                    <Select id="filtro-materia" value={filters.subjectId} onChange={change('subjectId')}>
                        <option value="">Todas</option>
                        {(classroom.subjects ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="filtro-tipo">Tipo</FormLabel>
                    <Select id="filtro-tipo" value={filters.assessmentType} onChange={change('assessmentType')}>
                        <option value="">Todos</option>
                        {ASSESSMENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="filtro-desde">Desde</FormLabel>
                    <Input id="filtro-desde" type="date" value={filters.from} onChange={change('from')} />
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="filtro-hasta">Hasta</FormLabel>
                    <Input id="filtro-hasta" type="date" value={filters.to} onChange={change('to')} />
                </FormControl>
            </SimpleGrid>

            <AsyncContent state={assessments} isEmpty={() => false} loadingMessage="Cargando evaluaciones…" errorTitle="No se pudieron cargar las evaluaciones">
                {(list) =>
                    list.length === 0 ? (
                        hasFilters ? (
                            <EmptyState
                                title="Ninguna evaluación coincide con los filtros"
                                action={
                                    <Button mt={2} size="sm" onClick={() => setFilters({ subjectId: '', assessmentType: '', from: '', to: '' })}>
                                        Limpiar filtros
                                    </Button>
                                }
                            />
                        ) : (
                            <EmptyState
                                icon={FiClipboard}
                                title="Esta aula aún no tiene evaluaciones"
                                description="Crea una evaluación para registrar las calificaciones de tus estudiantes."
                                action={
                                    classroom.isActive && (
                                        <Button mt={2} size="sm" leftIcon={<FiPlus />} onClick={onCreate}>
                                            Nueva evaluación
                                        </Button>
                                    )
                                }
                            />
                        )
                    ) : (
                        <Stack spacing={4}>
                            <TableContainer borderRadius="md" borderWidth="1px" borderColor="border.subtle" bg="bg.option" whiteSpace="normal">
                                <Table size="sm">
                                    <VisuallyHidden as="caption">Evaluaciones del aula, de la más reciente a la más antigua</VisuallyHidden>
                                    <Thead>
                                        <Tr>
                                            <Th>Fecha</Th>
                                            <Th>Evaluación</Th>
                                            <Th>Materia y tema</Th>
                                            <Th>Tipo</Th>
                                            <Th>Escala</Th>
                                            <Th>Metodología</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {pagination.pageItems.map((a) => (
                                            <Tr key={a.id}>
                                                <Td whiteSpace="nowrap">{formatAssessmentDate(a.assessmentDate)}</Td>
                                                <Td>
                                                    <Text as={RouterLink} to={ROUTES.assessmentDetail(a.id)} fontWeight="bold" color="text.primary" textDecoration="underline">
                                                        {a.title}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    {a.subject?.name ?? '—'}
                                                    {a.topic?.name && <Text fontSize="xs">{a.topic.name}</Text>}
                                                </Td>
                                                <Td>{assessmentTypeLabel(a.assessmentType)}</Td>
                                                <Td>
                                                    <ScaleBadge maxScore={a.maxScore} />
                                                </Td>
                                                <Td>{a.teachingMethod?.name ?? '—'}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                            <Pagination {...pagination} onChange={pagination.setPage} itemLabel="evaluaciones" />
                        </Stack>
                    )
                }
            </AsyncContent>
        </Stack>
    )
}

/** Evaluaciones de un aula y su seguimiento académico. */
export const ClassroomAssessmentsPage = () => {
    const { classroomId } = useParams()
    const [params, setParams] = useSearchParams()
    const navigate = useNavigate()
    const notify = useNotify()
    const [isCreating, setCreating] = useState(false)
    const classroom = useQuery(classroomId, () => getClassroom(classroomId))
    useDocumentTitle(classroom.data ? `Evaluaciones · ${classroom.data.name}` : 'Evaluaciones')

    const view = params.get('vista') === 'seguimiento' ? 'seguimiento' : 'evaluaciones'
    const thresholdParam = params.get('umbral')
    const threshold = thresholdParam !== null && !validateThreshold(thresholdParam) ? Number(thresholdParam) : null
    const subjectId = params.get('materia') ?? ''
    const setParam = (changes) => {
        const next = new URLSearchParams(params)
        for (const [name, value] of Object.entries(changes)) {
            if (value === null || value === '' || value === undefined) next.delete(name)
            else next.set(name, String(value))
        }
        setParams(next, { replace: true })
    }

    const back = (
        <Link as={RouterLink} to={ROUTES.classroomDetail(classroomId)} display="inline-flex" alignItems="center" gap={1} fontWeight="semibold">
            <FiArrowLeft aria-hidden /> Volver al aula
        </Link>
    )

    if (classroom.isLoading) return <LoadingState message="Cargando aula…" />
    if (classroom.isError) {
        return (
            <Stack spacing={4}>
                <Link as={RouterLink} to={ROUTES.assessments} fontWeight="semibold">
                    Volver a evaluaciones
                </Link>
                {classroom.error?.status === 404 ? (
                    <EmptyState title="Aula no encontrada" description="Esta aula no existe o no pertenece a tu cuenta." />
                ) : (
                    <ErrorState error={classroom.error} onRetry={classroom.run} />
                )}
            </Stack>
        )
    }
    const data = classroom.data
    if (!data) return null

    return (
        <Stack spacing={6}>
            {back}
            <PageHeader
                title={`Evaluaciones · ${data.name}`}
                description={`${classroomGradeLabel(data)} · Ciclo ${data.schoolYear}`}
                actions={
                    data.isActive && (
                        <Button leftIcon={<FiPlus />} onClick={() => setCreating(true)}>
                            Nueva evaluación
                        </Button>
                    )
                }
            />
            {!data.isActive && <FormAlert status="warning">El aula está archivada: puedes consultar sus evaluaciones, pero no crear nuevas.</FormAlert>}

            <Flex>
                <SegmentedControl name="vista-evaluaciones" label="Ver" options={VIEWS} value={view} onChange={(value) => setParam({ vista: value === 'evaluaciones' ? null : value })} />
            </Flex>

            {view === 'evaluaciones' ? (
                <SurfaceCard title="Evaluaciones" icon={FiClipboard}>
                    <AssessmentList classroom={data} onCreate={() => setCreating(true)} />
                </SurfaceCard>
            ) : (
                <SurfaceCard title="Seguimiento del aula" icon={FiTrendingUp}>
                    <ClassroomPerformance
                        classroom={data}
                        subjectId={subjectId}
                        onSubjectChange={(value) => setParam({ materia: value })}
                        threshold={threshold}
                        onThresholdChange={(value) => setParam({ umbral: value })}
                    />
                </SurfaceCard>
            )}

            <AssessmentFormModal
                isOpen={isCreating}
                classroom={data}
                onClose={() => setCreating(false)}
                onCreated={(created) => {
                    setCreating(false)
                    notify(`Se creó la evaluación "${created.title}". Ya puedes registrar las calificaciones.`)
                    navigate(ROUTES.assessmentDetail(created.id))
                }}
            />
        </Stack>
    )
}

export default ClassroomAssessmentsPage
