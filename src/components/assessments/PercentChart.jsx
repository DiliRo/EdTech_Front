import { useState } from 'react'
import { Box, Button, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VisuallyHidden } from '@chakra-ui/react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { colors } from '../../theme/colors.js'
import { formatAssessmentDate, formatPercent } from '../../utils/assessment.js'

const NAVY = colors.navy[500]
const TURQUOISE_DARK = colors.turquoise[600]
const TURQUOISE_LIGHT = colors.turquoise[300]
const WARNING = colors.warning[500]

const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const point = payload[0].payload
    return (
        <Box bg="bg.surface" borderWidth="1px" borderColor="border.strong" borderRadius="md" px={3} py={2} fontSize="sm" boxShadow="md">
            <Text fontWeight="bold" color="text.primary">
                {point.title}
            </Text>
            <Text>{formatAssessmentDate(point.date)}</Text>
            <Text color="text.primary" fontWeight="semibold">
                {formatPercent(point.value)}
            </Text>
            {point.detail && <Text>{point.detail}</Text>}
        </Box>
    )
}

/**
 * Evolución de porcentajes de logro en orden cronológico (eje Y de 0 a 100 %), con la línea del
 * umbral de revisión. Incluye la tabla con los mismos datos para lectores de pantalla y para
 * quien prefiera leer los valores.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, date: string, title: string, value: number, detail?: string }>} props.data  ordenados por fecha
 * @param {number} [props.threshold]
 * @param {string} props.description  resumen del gráfico para lectores de pantalla
 * @param {string} props.valueLabel   encabezado de la columna de valores
 */
export const PercentChart = ({ data, threshold, description, valueLabel = 'Logro' }) => {
    const [showTable, setShowTable] = useState(false)

    return (
        <Box>
            <Box role="img" aria-label={description} bg="bg.option" borderRadius="lg" borderWidth="1px" borderColor="border.subtle" p={{ base: 2, md: 4 }} h="300px">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid stroke={TURQUOISE_DARK} strokeOpacity={0.35} strokeDasharray="4 4" />
                        <XAxis dataKey="label" tick={{ fill: NAVY, fontSize: 12 }} stroke={NAVY} />
                        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit=" %" tick={{ fill: NAVY, fontSize: 12 }} stroke={NAVY} width={52} />
                        <Tooltip content={<ChartTooltip />} />
                        {typeof threshold === 'number' && (
                            <ReferenceLine
                                y={threshold}
                                stroke={WARNING}
                                strokeDasharray="6 4"
                                strokeWidth={2}
                                label={{ value: `Umbral ${threshold} %`, position: 'insideBottomRight', fill: WARNING, fontSize: 12, fontWeight: 600 }}
                            />
                        )}
                        <Area type="monotone" dataKey="value" stroke="none" fill={TURQUOISE_LIGHT} fillOpacity={0.6} isAnimationActive={false} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={NAVY}
                            strokeWidth={3}
                            dot={{ r: 5, fill: TURQUOISE_DARK, stroke: NAVY, strokeWidth: 2 }}
                            activeDot={{ r: 7 }}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </Box>
            <Button size="xs" variant="link" mt={2} onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
                {showTable ? 'Ocultar datos del gráfico' : 'Ver datos del gráfico'}
            </Button>
            {showTable && (
                <TableContainer mt={2}>
                    <Table size="sm">
                        <VisuallyHidden as="caption">Datos del gráfico, en orden cronológico</VisuallyHidden>
                        <Thead>
                            <Tr>
                                <Th>Fecha</Th>
                                <Th>Evaluación</Th>
                                <Th isNumeric>{valueLabel}</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data.map((point) => (
                                <Tr key={point.key}>
                                    <Td>{formatAssessmentDate(point.date)}</Td>
                                    <Td>{point.title}</Td>
                                    <Td isNumeric>{formatPercent(point.value)}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    )
}
