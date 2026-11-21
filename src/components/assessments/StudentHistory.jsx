import { Badge, List, ListItem, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VisuallyHidden } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { assessmentTypeLabel, formatAssessmentDate, formatPercent, formatScore } from '../../utils/assessment.js'
import { ROUTES } from '../../utils/constants.js'

const dateTime = (value) => (value ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '')

/**
 * Historial de calificaciones de un estudiante, de la evaluación más antigua a la más reciente
 * (GET /api/students/:id/results). Cada nota muestra su escala y sus correcciones.
 */
export const StudentHistory = ({ results }) => (
    <TableContainer borderRadius="md" borderWidth="1px" borderColor="border.subtle" bg="bg.option" whiteSpace="normal">
        <Table size="sm">
            <VisuallyHidden as="caption">Historial de calificaciones en orden cronológico</VisuallyHidden>
            <Thead>
                <Tr>
                    <Th>Fecha</Th>
                    <Th>Evaluación</Th>
                    <Th>Tipo</Th>
                    <Th isNumeric>Nota</Th>
                    <Th isNumeric>Logro</Th>
                    <Th minW="180px">Observaciones y correcciones</Th>
                </Tr>
            </Thead>
            <Tbody>
                {results.map(({ assessment, result }) => (
                    <Tr key={result.id}>
                        <Td whiteSpace="nowrap">{formatAssessmentDate(assessment.assessmentDate)}</Td>
                        <Td>
                            <Text as={RouterLink} to={ROUTES.assessmentDetail(assessment.id)} color="text.primary" fontWeight="semibold" textDecoration="underline">
                                {assessment.title}
                            </Text>
                        </Td>
                        <Td>{assessmentTypeLabel(assessment.assessmentType)}</Td>
                        <Td isNumeric whiteSpace="nowrap" fontWeight="semibold" color="text.primary">
                            {formatScore(result.score, assessment.maxScore)}
                        </Td>
                        <Td isNumeric>{formatPercent(result.percentage)}</Td>
                        <Td>
                            {result.observations && <Text fontSize="sm">{result.observations}</Text>}
                            {result.corrections?.length > 0 && (
                                <>
                                    <Badge mt={1} bg="status.warningBg" color="status.warning" textTransform="none">
                                        Corregida {result.corrections.length} {result.corrections.length === 1 ? 'vez' : 'veces'}
                                    </Badge>
                                    <List fontSize="xs" mt={1} spacing={0.5}>
                                        {result.corrections.map((c, i) => (
                                            <ListItem key={i}>
                                                {dateTime(c.changedAt)}: antes {formatScore(c.previousScore, assessment.maxScore)}
                                                {c.reason ? ` — ${c.reason}` : ''}
                                            </ListItem>
                                        ))}
                                    </List>
                                </>
                            )}
                            {!result.observations && !result.corrections?.length && <Text fontSize="sm">—</Text>}
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    </TableContainer>
)
