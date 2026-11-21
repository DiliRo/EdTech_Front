import { Badge, Box, Flex, Icon, Stat, StatHelpText, StatLabel, StatNumber, Text } from '@chakra-ui/react'
import { FiAlertTriangle, FiArrowDownRight, FiArrowRight, FiArrowUpRight, FiInfo } from 'react-icons/fi'
import { formatNumber, reviewStatus, trendText } from '../../utils/assessment.js'

/** Tarjeta de cifra: `dark` (navy con texto claro) o `light` (turquesa con cifra navy). */
export const StatCard = ({ label, value, help, variant = 'light' }) => {
    const dark = variant === 'dark'
    return (
        <Stat
            bg={dark ? 'bg.sidebar' : 'bg.option'}
            color={dark ? 'text.onDark' : 'text.primary'}
            px={4}
            py={3}
            borderRadius="lg"
            borderWidth="2px"
            borderColor={dark ? 'bg.sidebar' : 'border.subtle'}
        >
            <StatLabel color={dark ? 'text.onDarkMuted' : 'text.secondary'} fontWeight="semibold">
                {label}
            </StatLabel>
            <StatNumber fontSize="2xl" color={dark ? 'text.onDark' : 'text.primary'}>
                {value}
            </StatNumber>
            {help && (
                <StatHelpText mb={0} color={dark ? 'text.onDarkMuted' : 'text.secondary'} fontSize="xs">
                    {help}
                </StatHelpText>
            )}
        </Stat>
    )
}

/** Aviso de que no hay datos suficientes: no se calcula la estadística. */
export const InsufficientData = ({ children }) => (
    <Flex gap={2} align="flex-start" bg="bg.surfaceMuted" px={4} py={3} borderRadius="md" borderWidth="1px" borderStyle="dashed" borderColor="border.subtle">
        <Icon as={FiInfo} mt={1} color="text.primary" aria-hidden />
        <Text fontSize="sm">{children}</Text>
    </Flex>
)

/** Nota del backend: los indicadores apoyan al docente, no diagnostican. */
export const SupportNote = ({ note, threshold }) => (
    <Flex gap={2} align="flex-start" fontSize="sm" bg="bg.option" px={4} py={3} borderRadius="md" borderLeftWidth="4px" borderLeftColor="border.strong">
        <Icon as={FiInfo} mt={1} color="text.primary" aria-hidden />
        <Text>
            {note ?? 'Indicadores de apoyo para el docente: no son un diagnóstico.'}
            {threshold !== undefined && threshold !== null && ` Umbral de revisión: ${formatNumber(threshold)} % de logro.`}
        </Text>
    </Flex>
)

/** Escala de la evaluación, siempre visible. */
export const ScaleBadge = ({ maxScore }) => (
    <Badge bg="bg.sidebar" color="text.onDark" px={2} py={0.5} borderRadius="md" textTransform="none" fontSize="sm">
        Escala: 0 a {formatNumber(maxScore)}
    </Badge>
)

/** Indicador de revisión adicional (apoyo, no diagnóstico). */
export const ReviewBadge = ({ belowThreshold, resultsCount }) => {
    const status = reviewStatus({ belowThreshold, resultsCount })
    if (status === 'insufficient') {
        return (
            <Badge bg="bg.surfaceMuted" color="text.secondary" borderWidth="1px" borderStyle="dashed" borderColor="border.subtle" textTransform="none">
                Datos insuficientes
            </Badge>
        )
    }
    if (status === 'review') {
        return (
            <Badge bg="status.warningBg" color="status.warning" borderWidth="1px" borderColor="status.warning" textTransform="none" display="inline-flex" alignItems="center" gap={1}>
                <FiAlertTriangle aria-hidden /> Revisión sugerida
            </Badge>
        )
    }
    return (
        <Badge bg="bg.option" color="text.primary" borderWidth="1px" borderColor="border.subtle" textTransform="none">
            Sobre el umbral
        </Badge>
    )
}

const TREND_ICONS = { up: FiArrowUpRight, down: FiArrowDownRight, stable: FiArrowRight }

/** Tendencia con texto (no solo color o ícono). */
export const TrendLabel = ({ trend }) => {
    const text = trendText(trend)
    if (!text) return <Text as="span" fontSize="sm">Sin tendencia (menos de 2 calificaciones)</Text>
    return (
        <Flex as="span" display="inline-flex" align="center" gap={1} fontSize="sm" color="text.primary" fontWeight="medium">
            <Icon as={TREND_ICONS[trend.direction]} aria-hidden />
            {text}
        </Flex>
    )
}

/** Calificación faltante: se distingue visualmente de un cero. */
export const MissingGrade = () => (
    <Box as="span" display="inline-block" px={2} py={0.5} fontSize="xs" fontWeight="semibold" borderRadius="md" borderWidth="1px" borderStyle="dashed" borderColor="border.strong" color="text.primary" bg="transparent">
        Sin calificación
    </Box>
)
