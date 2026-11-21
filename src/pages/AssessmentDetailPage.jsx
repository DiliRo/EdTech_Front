import { Badge, Flex, Heading, Link, SimpleGrid, Stack, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { FiArrowLeft, FiEdit3 } from 'react-icons/fi'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { LoadingState } from '../components/feedback/LoadingState.jsx'
import { ErrorState } from '../components/feedback/ErrorState.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { StatCard, InsufficientData, ScaleBadge, SupportNote } from '../components/assessments/Indicators.jsx'
import { GradesTable } from '../components/assessments/GradesTable.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { useNotify } from '../hooks/useNotify.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getAssessment, recordResults } from '../services/assessment.service.js'
import { MIN_RESULTS_FOR_GROUP_STATS, buildGradeRows, assessmentTypeLabel, formatAssessmentDate, formatNumber, formatPercent } from '../utils/assessment.js'
import { ROUTES } from '../utils/constants.js'

const Chip = ({ children }) => (
    <Badge bg="bg.option" color="text.primary" borderWidth="1px" borderColor="border.subtle" px={2} py={0.5} borderRadius="md" textTransform="none" fontSize="sm" fontWeight="medium">
        {children}
    </Badge>
)

const describeSaved = ({ created, updated, unchanged }) =>
    [created && `${created} ${created === 1 ? 'nueva' : 'nuevas'}`, updated && `${updated} ${updated === 1 ? 'corregida' : 'corregidas'}`, unchanged && `${unchanged} sin cambios`]
        .filter(Boolean)
        .join(', ')

/** Detalle de una evaluación: datos, escala, resumen y tabla editable de calificaciones. */
export const AssessmentDetailPage = () => {
    const { assessmentId } = useParams()
    const notify = useNotify()
    const detail = useQuery(assessmentId, () => getAssessment(assessmentId))
    useDocumentTitle(detail.data?.assessment.title ?? 'Evaluación')

    if (detail.isLoading) return <LoadingState message="Cargando evaluación…" />
    if (detail.isError) {
        return (
            <Stack spacing={4}>
                <Link as={RouterLink} to={ROUTES.assessments} fontWeight="semibold">
                    Volver a evaluaciones
                </Link>
                {detail.error?.status === 404 ? (
                    <EmptyState title="Evaluación no encontrada" description="No existe o no pertenece a tu cuenta." />
                ) : (
                    <ErrorState error={detail.error} onRetry={detail.run} />
                )}
            </Stack>
        )
    }
    const data = detail.data
    if (!data) return null
    const { assessment, summary } = data
    const rows = buildGradeRows(data)
    const enough = summary.count >= MIN_RESULTS_FOR_GROUP_STATS
    // Al cambiar las calificaciones guardadas, la tabla se reinicia con los datos nuevos
    const tableKey = data.results.map((r) => `${r.id}:${r.updatedAt}`).join('|') + data.pendingStudents.map((p) => p.studentId).join('|')

    const save = async (entries) => {
        const outcome = await recordResults(assessment.id, entries)
        notify(`Calificaciones guardadas: ${describeSaved(outcome.summary)}.`)
        detail.run()
    }

    return (
        <Stack spacing={6}>
            <Link as={RouterLink} to={ROUTES.classroomAssessments(assessment.classroomId)} display="inline-flex" alignItems="center" gap={1} fontWeight="semibold">
                <FiArrowLeft aria-hidden /> Volver a las evaluaciones del aula
            </Link>

            <Stack spacing={3}>
                <Heading as="h1" size="lg">
                    {assessment.title}
                </Heading>
                <Wrap spacing={2}>
                    <WrapItem>
                        <ScaleBadge maxScore={assessment.maxScore} />
                    </WrapItem>
                    <WrapItem>
                        <Chip>{formatAssessmentDate(assessment.assessmentDate, 'long')}</Chip>
                    </WrapItem>
                    <WrapItem>
                        <Chip>{assessmentTypeLabel(assessment.assessmentType)}</Chip>
                    </WrapItem>
                    {assessment.classroom?.name && (
                        <WrapItem>
                            <Chip>Aula: {assessment.classroom.name}</Chip>
                        </WrapItem>
                    )}
                    {assessment.subject?.name && (
                        <WrapItem>
                            <Chip>Materia: {assessment.subject.name}</Chip>
                        </WrapItem>
                    )}
                    {assessment.topic?.name && (
                        <WrapItem>
                            <Chip>Tema: {assessment.topic.name}</Chip>
                        </WrapItem>
                    )}
                    {assessment.teachingMethod?.name && (
                        <WrapItem>
                            <Chip>Metodología: {assessment.teachingMethod.name}</Chip>
                        </WrapItem>
                    )}
                </Wrap>
            </Stack>

            <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={3}>
                <StatCard variant="dark" label="Calificadas" value={summary.count} />
                <StatCard label="Sin calificación" value={summary.pendingCount} help="no cuentan como cero" />
                <StatCard variant="dark" label="Registro completo" value={formatPercent(summary.completionRate)} />
                <StatCard label="Promedio" value={enough ? formatPercent(summary.average) : '—'} help={enough ? 'de logro' : 'Datos insuficientes'} />
                <StatCard variant="dark" label="Mediana" value={enough ? formatPercent(summary.median) : '—'} />
                <StatCard label="Mínimo – máximo" value={enough ? `${formatNumber(summary.min)}–${formatPercent(summary.max)}` : '—'} />
            </SimpleGrid>
            {!enough && (
                <InsufficientData>
                    Las estadísticas se calculan con al menos {MIN_RESULTS_FOR_GROUP_STATS} calificaciones registradas. Hasta ahora hay {summary.count}.
                </InsufficientData>
            )}
            <SupportNote note={data.note} />

            <SurfaceCard title="Calificaciones" icon={FiEdit3} description={`Escribe la nota de 0 a ${assessment.maxScore}. Deja la celda vacía si el estudiante aún no tiene nota: no se guardará como cero.`}>
                {rows.length === 0 ? (
                    <EmptyState title="El aula no tiene estudiantes activos" description="Agrega estudiantes al aula para registrar sus calificaciones." />
                ) : (
                    <GradesTable key={tableKey} assessment={assessment} rows={rows} onSave={save} />
                )}
                <Flex mt={4}>
                    <Text fontSize="xs">Una nota registrada se puede corregir, pero no borrar. Cada corrección conserva el valor anterior.</Text>
                </Flex>
            </SurfaceCard>
        </Stack>
    )
}

export default AssessmentDetailPage
