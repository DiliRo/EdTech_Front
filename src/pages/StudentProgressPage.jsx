import { Flex, FormControl, FormLabel, Heading, Link, Select, SimpleGrid, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { FiArrowLeft, FiClock, FiTrendingUp } from 'react-icons/fi'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { LoadingState } from '../components/feedback/LoadingState.jsx'
import { ErrorState } from '../components/feedback/ErrorState.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { StatCard, InsufficientData, SupportNote, ReviewBadge, TrendLabel } from '../components/assessments/Indicators.jsx'
import { LazyPercentChart as PercentChart } from '../components/assessments/LazyPercentChart.jsx'
import { ThresholdControl } from '../components/assessments/ThresholdControl.jsx'
import { StudentHistory } from '../components/assessments/StudentHistory.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getStudentProgress, getStudentResults } from '../services/assessment.service.js'
import { getClassroom } from '../services/classroom.service.js'
import { MIN_POINTS_FOR_CHART, MIN_RESULTS_FOR_STUDENT_STATS, formatPercent, formatScore, shortAssessmentDate, validateThreshold } from '../utils/assessment.js'
import { ROUTES } from '../utils/constants.js'

/**
 * Historial y evolución de un estudiante, identificado solo por su código.
 * Usa GET /api/students/:id/progress (evolución y resumen) y /results (historial con correcciones).
 */
export const StudentProgressPage = () => {
    const { studentId } = useParams()
    const [params, setParams] = useSearchParams()
    const thresholdParam = params.get('umbral')
    const threshold = thresholdParam !== null && !validateThreshold(thresholdParam) ? Number(thresholdParam) : null
    const subjectId = params.get('materia') ?? ''
    const setParam = (name, value) => {
        const next = new URLSearchParams(params)
        if (value === null || value === '') next.delete(name)
        else next.set(name, String(value))
        setParams(next, { replace: true })
    }

    const filterKey = `${studentId}:${subjectId}`
    const progress = useQuery(`${filterKey}:${threshold ?? 'default'}`, () =>
        getStudentProgress(studentId, { subjectId: subjectId || undefined, threshold: threshold ?? undefined })
    )
    const history = useQuery(filterKey, () => getStudentResults(studentId, { subjectId: subjectId || undefined }))
    const classroomId = progress.data?.student.classroomId ?? history.data?.student.classroomId ?? null
    const classroom = useQuery(classroomId, () => getClassroom(classroomId))
    const code = progress.data?.student.studentCode ?? history.data?.student.studentCode
    useDocumentTitle(code ? `Seguimiento ${code}` : 'Seguimiento del estudiante')

    const firstError = progress.isError ? progress : history.isError ? history : null
    if (firstError) {
        return (
            <Stack spacing={4}>
                <Link as={RouterLink} to={ROUTES.assessments} fontWeight="semibold">
                    Volver a evaluaciones
                </Link>
                {firstError.error?.status === 404 ? (
                    <EmptyState title="Estudiante no encontrado" description="No existe o no pertenece a una de tus aulas." />
                ) : (
                    <ErrorState error={firstError.error} onRetry={firstError.run} />
                )}
            </Stack>
        )
    }
    if (!progress.data || !history.data) return <LoadingState message="Cargando seguimiento…" />

    const { student, summary, evolution, bySubject } = progress.data
    const enough = summary.resultsCount >= MIN_RESULTS_FOR_STUDENT_STATS
    const chartData = evolution.map((e) => ({
        key: e.assessmentId,
        label: shortAssessmentDate(e.assessmentDate),
        date: e.assessmentDate,
        title: e.title,
        value: e.percentage,
        detail: `Nota ${formatScore(e.score, e.maxScore)}`
    }))
    const backTo = `${ROUTES.classroomAssessments(student.classroomId)}?vista=seguimiento${threshold !== null ? `&umbral=${threshold}` : ''}`

    return (
        <Stack spacing={6}>
            <Link as={RouterLink} to={backTo} display="inline-flex" alignItems="center" gap={1} fontWeight="semibold">
                <FiArrowLeft aria-hidden /> Volver al seguimiento del aula
            </Link>

            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={3}>
                <Stack spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold">
                        Estudiante{classroom.data ? ` · ${classroom.data.name}` : ''}
                    </Text>
                    <Heading as="h1" size="lg" fontFamily="mono">
                        {student.studentCode}
                    </Heading>
                    {!student.isActive && <Text fontSize="sm">Retirado del aula: se conserva su historial.</Text>}
                </Stack>
                <Flex align="flex-start">
                    <ReviewBadge belowThreshold={summary.belowThreshold} resultsCount={summary.resultsCount} />
                </Flex>
            </Flex>

            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ md: 'flex-start' }}>
                <FormControl maxW={{ md: '280px' }}>
                    <FormLabel htmlFor="estudiante-materia">Materia</FormLabel>
                    <Select id="estudiante-materia" value={subjectId} onChange={(e) => setParam('materia', e.target.value)}>
                        <option value="">Todas las materias</option>
                        {(classroom.data?.subjects ?? bySubject.map((s) => ({ id: s.subjectId, name: s.subjectName }))).map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </Select>
                </FormControl>
                <ThresholdControl
                    key={threshold ?? progress.data.threshold}
                    value={threshold ?? progress.data.threshold}
                    defaultValue={threshold === null ? progress.data.threshold : undefined}
                    isCustom={threshold !== null}
                    onApply={(value) => setParam('umbral', value)}
                    onReset={() => setParam('umbral', null)}
                />
            </Flex>

            <SupportNote note={progress.data.note} threshold={progress.data.threshold} />

            <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={3}>
                <StatCard variant="dark" label="Calificaciones" value={summary.resultsCount} help="registradas" />
                <StatCard label="Sin calificación" value={summary.assessmentsWithoutResult} help="no cuentan como cero" />
                <StatCard variant="dark" label="Promedio de logro" value={enough ? formatPercent(summary.averagePercentage) : '—'} help={enough ? `Mediana ${formatPercent(summary.medianPercentage)}` : 'Datos insuficientes'} />
                <StatCard label="Último resultado" value={formatPercent(summary.latestPercentage)} />
                <StatCard variant="dark" label="Tendencia" value={enough ? <TrendLabelInline trend={progress.data.trend} /> : '—'} help="primera vs. última" />
            </SimpleGrid>
            {!enough && (
                <InsufficientData>
                    Se necesitan al menos {MIN_RESULTS_FOR_STUDENT_STATS} calificaciones para calcular el promedio, la tendencia y el indicador de revisión.
                </InsufficientData>
            )}

            <SurfaceCard title="Evolución en el tiempo" icon={FiTrendingUp} description="Porcentaje de logro en cada evaluación, de la más antigua a la más reciente.">
                {chartData.length >= MIN_POINTS_FOR_CHART ? (
                    <PercentChart
                        data={chartData}
                        threshold={progress.data.threshold}
                        description={`Evolución de ${student.studentCode} en ${chartData.length} evaluaciones, desde ${formatPercent(chartData[0].value)} hasta ${formatPercent(chartData[chartData.length - 1].value)}.`}
                    />
                ) : (
                    <InsufficientData>Para mostrar la evolución se necesitan al menos {MIN_POINTS_FOR_CHART} calificaciones registradas.</InsufficientData>
                )}
            </SurfaceCard>

            {bySubject.length > 0 && (
                <SurfaceCard title="Por materia">
                    <TableContainer borderRadius="md" borderWidth="1px" borderColor="border.subtle" bg="bg.option">
                        <Table size="sm">
                            <Thead>
                                <Tr>
                                    <Th>Materia</Th>
                                    <Th isNumeric>Calificaciones</Th>
                                    <Th isNumeric>Sin calificación</Th>
                                    <Th isNumeric>Promedio</Th>
                                    <Th>Tendencia</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {bySubject.map((s) => {
                                    const subjectEnough = s.resultsCount >= MIN_RESULTS_FOR_STUDENT_STATS
                                    return (
                                        <Tr key={s.subjectId}>
                                            <Td>{s.subjectName ?? '—'}</Td>
                                            <Td isNumeric>{s.resultsCount}</Td>
                                            <Td isNumeric>{s.assessmentsWithoutResult}</Td>
                                            <Td isNumeric>{subjectEnough ? formatPercent(s.averagePercentage) : 'Datos insuficientes'}</Td>
                                            <Td>{subjectEnough ? <TrendLabel trend={s.trend} /> : '—'}</Td>
                                        </Tr>
                                    )
                                })}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </SurfaceCard>
            )}

            <SurfaceCard title="Historial de evaluaciones" icon={FiClock} description="En orden cronológico, con la escala de cada evaluación.">
                {history.data.results.length ? (
                    <StudentHistory results={history.data.results} />
                ) : (
                    <EmptyState title="Aún no tiene calificaciones registradas" />
                )}
                {history.data.assessmentsWithoutResult > 0 && (
                    <Text fontSize="sm" mt={3}>
                        {history.data.assessmentsWithoutResult} {history.data.assessmentsWithoutResult === 1 ? 'evaluación' : 'evaluaciones'} del aula sin calificación
                        de este estudiante (no cuentan como cero).
                    </Text>
                )}
            </SurfaceCard>
        </Stack>
    )
}

/** Tendencia dentro de una tarjeta oscura (texto claro). */
const TrendLabelInline = ({ trend }) => {
    if (!trend?.direction) return '—'
    const sign = trend.change > 0 ? '+' : ''
    return `${sign}${trend.change} pts`
}

export default StudentProgressPage
