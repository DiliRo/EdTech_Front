import { useState } from 'react'
import { Checkbox, Flex, FormControl, FormLabel, Heading, Select, SimpleGrid, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VisuallyHidden } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AsyncContent } from '../feedback/AsyncContent.jsx'
import { EmptyState } from '../feedback/EmptyState.jsx'
import { StatCard, InsufficientData, SupportNote, ReviewBadge, TrendLabel } from './Indicators.jsx'
import { LazyPercentChart as PercentChart } from './LazyPercentChart.jsx'
import { ThresholdControl } from './ThresholdControl.jsx'
import { useQuery } from '../../hooks/useQuery.js'
import { getClassroomPerformance } from '../../services/assessment.service.js'
import {
    MIN_POINTS_FOR_CHART,
    MIN_RESULTS_FOR_GROUP_STATS,
    MIN_RESULTS_FOR_STUDENT_STATS,
    formatNumber,
    formatPercent,
    reviewStatus,
    shortAssessmentDate
} from '../../utils/assessment.js'
import { ROUTES } from '../../utils/constants.js'

/** Enlace al historial de un estudiante, conservando el umbral elegido. */
const studentLink = (studentId, threshold) => `${ROUTES.studentProgress(studentId)}${threshold !== null ? `?umbral=${threshold}` : ''}`

/**
 * Seguimiento del aula (GET /api/classrooms/:id/performance): cifras generales, evolución de
 * los promedios por evaluación en orden cronológico y estudiantes con revisión sugerida.
 * Sin datos suficientes no se calcula ninguna estadística.
 */
export const ClassroomPerformance = ({ classroom, subjectId, onSubjectChange, threshold, onThresholdChange }) => {
    const [onlyReview, setOnlyReview] = useState(false)
    const key = `${classroom.id}:${subjectId}:${threshold ?? 'default'}`
    const performance = useQuery(key, () => getClassroomPerformance(classroom.id, { subjectId: subjectId || undefined, threshold: threshold ?? undefined }))

    return (
        <Stack spacing={5}>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ md: 'flex-start' }}>
                <FormControl maxW={{ md: '280px' }}>
                    <FormLabel htmlFor="seguimiento-materia">Materia</FormLabel>
                    <Select id="seguimiento-materia" value={subjectId} onChange={(e) => onSubjectChange(e.target.value)}>
                        <option value="">Todas las materias</option>
                        {(classroom.subjects ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </Select>
                </FormControl>
                <ThresholdControl
                    key={threshold ?? performance.data?.threshold ?? 'default'}
                    value={threshold ?? performance.data?.threshold ?? ''}
                    defaultValue={threshold === null ? performance.data?.threshold : undefined}
                    isCustom={threshold !== null}
                    onApply={onThresholdChange}
                    onReset={() => onThresholdChange(null)}
                />
            </Flex>

            <AsyncContent state={performance} isEmpty={() => false} loadingMessage="Calculando seguimiento…" errorTitle="No se pudo cargar el seguimiento del aula">
                {(data) => {
                    const { summary } = data
                    if (summary.assessmentsCount === 0) {
                        return <EmptyState title="Aún no hay evaluaciones" description="Crea una evaluación y registra calificaciones para ver el seguimiento del aula." />
                    }
                    const enoughGroup = summary.resultsCount >= MIN_RESULTS_FOR_GROUP_STATS
                    const chartData = data.perAssessment
                        .filter((a) => a.resultsCount >= MIN_RESULTS_FOR_GROUP_STATS && a.averagePercentage !== null)
                        .map((a) => ({
                            key: a.id,
                            label: shortAssessmentDate(a.assessmentDate),
                            date: a.assessmentDate,
                            title: a.title,
                            value: a.averagePercentage,
                            detail: `${a.resultsCount} calificaciones`
                        }))
                    const reviewCount = data.perStudent.filter((s) => reviewStatus(s) === 'review').length
                    const students = onlyReview ? data.perStudent.filter((s) => reviewStatus(s) === 'review') : data.perStudent

                    return (
                        <Stack spacing={6}>
                            <SupportNote note={data.note} threshold={data.threshold} />

                            <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={3}>
                                <StatCard variant="dark" label="Evaluaciones" value={summary.assessmentsCount} />
                                <StatCard label="Estudiantes activos" value={summary.studentsCount} />
                                <StatCard variant="dark" label="Calificaciones" value={summary.resultsCount} help="registradas" />
                                <StatCard label="Registro completo" value={formatPercent(summary.completionRate)} help="de las calificaciones esperadas" />
                                <StatCard
                                    variant="dark"
                                    label="Promedio del aula"
                                    value={enoughGroup ? formatPercent(summary.averagePercentage) : '—'}
                                    help={enoughGroup ? `Mediana ${formatPercent(summary.medianPercentage)}` : 'Datos insuficientes'}
                                />
                                <StatCard label="Revisión sugerida" value={reviewCount} help={`bajo ${formatNumber(data.threshold)} %`} />
                            </SimpleGrid>

                            {!enoughGroup && (
                                <InsufficientData>
                                    Se necesitan al menos {MIN_RESULTS_FOR_GROUP_STATS} calificaciones registradas para calcular estadísticas del aula. Las
                                    evaluaciones sin calificación no cuentan como cero.
                                </InsufficientData>
                            )}

                            <Stack spacing={3}>
                                <Heading as="h3" size="sm">
                                    Evolución del promedio por evaluación
                                </Heading>
                                {chartData.length >= MIN_POINTS_FOR_CHART ? (
                                    <PercentChart
                                        data={chartData}
                                        threshold={data.threshold}
                                        valueLabel="Promedio de logro"
                                        description={`Promedio de logro del aula en ${chartData.length} evaluaciones, de la más antigua a la más reciente. Desde ${formatPercent(chartData[0].value)} hasta ${formatPercent(chartData[chartData.length - 1].value)}.`}
                                    />
                                ) : (
                                    <InsufficientData>
                                        Para mostrar la evolución se necesitan al menos {MIN_POINTS_FOR_CHART} evaluaciones con {MIN_RESULTS_FOR_GROUP_STATS} o más
                                        calificaciones cada una.
                                    </InsufficientData>
                                )}
                            </Stack>

                            <Stack spacing={3}>
                                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                                    <Heading as="h3" size="sm">
                                        Estudiantes
                                    </Heading>
                                    <Checkbox isChecked={onlyReview} onChange={(e) => setOnlyReview(e.target.checked)}>
                                        Solo con revisión sugerida
                                    </Checkbox>
                                </Flex>
                                <Text fontSize="sm">
                                    La revisión sugerida se indica cuando el promedio del estudiante queda bajo el umbral y tiene al menos{' '}
                                    {MIN_RESULTS_FOR_STUDENT_STATS} calificaciones. Es una alerta para acompañar, no un diagnóstico.
                                </Text>
                                {students.length === 0 ? (
                                    <EmptyState title={onlyReview ? 'Ningún estudiante tiene revisión sugerida' : 'El aula no tiene estudiantes'} />
                                ) : (
                                    <TableContainer borderRadius="md" borderWidth="1px" borderColor="border.subtle" bg="bg.option">
                                        <Table size="sm">
                                            <VisuallyHidden as="caption">Seguimiento por estudiante</VisuallyHidden>
                                            <Thead>
                                                <Tr>
                                                    <Th>Código</Th>
                                                    <Th isNumeric>Calificaciones</Th>
                                                    <Th isNumeric>Sin calificación</Th>
                                                    <Th isNumeric>Promedio</Th>
                                                    <Th>Tendencia</Th>
                                                    <Th>Indicador</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {students.map((s) => {
                                                    const enough = s.resultsCount >= MIN_RESULTS_FOR_STUDENT_STATS
                                                    return (
                                                        <Tr key={s.studentId}>
                                                            <Td>
                                                                <Text as={RouterLink} to={studentLink(s.studentId, threshold)} fontFamily="mono" fontWeight="bold" color="text.primary" textDecoration="underline">
                                                                    {s.studentCode}
                                                                </Text>
                                                                {!s.isActive && <Text as="span" fontSize="xs" ml={2}>(retirado)</Text>}
                                                            </Td>
                                                            <Td isNumeric>{s.resultsCount}</Td>
                                                            <Td isNumeric>{s.assessmentsWithoutResult}</Td>
                                                            <Td isNumeric fontWeight="semibold" color="text.primary">
                                                                {enough ? formatPercent(s.averagePercentage) : '—'}
                                                            </Td>
                                                            <Td>{enough ? <TrendLabel trend={s.trend} /> : '—'}</Td>
                                                            <Td>
                                                                <ReviewBadge belowThreshold={s.belowThreshold} resultsCount={s.resultsCount} />
                                                            </Td>
                                                        </Tr>
                                                    )
                                                })}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Stack>
                        </Stack>
                    )
                }}
            </AsyncContent>
        </Stack>
    )
}
