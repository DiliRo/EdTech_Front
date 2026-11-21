import { Badge, Box, Flex, Heading, Icon, Link, List, ListItem, Stack, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { FiAward, FiBookmark, FiCheckSquare, FiExternalLink, FiFileText } from 'react-icons/fi'
import { SampleDataNotice } from './SampleDataNotice.jsx'
import { EmptyState } from '../feedback/EmptyState.jsx'
import { gradeOrdinal } from '../../utils/catalog.js'

const SOURCE_LABELS = { cnb: 'Currículo Nacional Base (CNB)', sample: 'Datos de prueba' }

const REFERENCE_FIELDS = [
    ['document', 'Documento'],
    ['version', 'Versión'],
    ['area', 'Área'],
    ['page', 'Página']
]

/** Solo enlaces http(s); cualquier otro esquema se muestra como texto. */
const safeUrl = (value) => {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
    } catch {
        return null
    }
}

const Section = ({ icon, title, children }) => (
    <Stack as="section" spacing={3} aria-label={title}>
        <Flex align="center" gap={2}>
            <Icon as={icon} boxSize={5} color="text.primary" aria-hidden />
            <Heading as="h4" size="sm">
                {title}
            </Heading>
        </Flex>
        {children}
    </Stack>
)

/** Ausencia de un dato en el catálogo. No se rellena con contenido inventado. */
const Missing = ({ children }) => (
    <Text fontSize="sm" fontStyle="italic" bg="bg.surfaceMuted" px={3} py={2} borderRadius="md">
        {children}
    </Text>
)

const CodeTag = ({ children }) => (
    <Tag size="sm" bg="navy.500" color="white" fontWeight="semibold" flexShrink={0}>
        {children}
    </Tag>
)

/**
 * Descripción, competencias, indicadores de logro y referencia curricular de un tema, tal como
 * los devuelve GET /api/topics/:id. Si un dato no existe en el catálogo se indica su ausencia.
 */
export const TopicDetail = ({ topic, containsSampleData = false }) => {
    const competencies = topic.competencies ?? []
    const indicators = topic.achievementIndicators ?? []
    const description = topic.description?.trim()
    const reference = topic.curriculumReference ?? {}
    const referenceRows = REFERENCE_FIELDS.filter(([key]) => reference[key])
    const referenceUrl = reference.url ? safeUrl(reference.url) : null
    const hasCurricularInfo = Boolean(description) || competencies.length > 0 || indicators.length > 0
    const isSample = containsSampleData || topic.isSample === true

    return (
        <Stack spacing={6}>
            <Stack spacing={2}>
                <Wrap spacing={2}>
                    {topic.grade?.name && (
                        <WrapItem>
                            <Badge bg="bg.optionSelected" color="text.primary" px={2} py={0.5} borderRadius="md">
                                {topic.grade.number ? `${gradeOrdinal(topic.grade.number)} · ` : ''}
                                {topic.grade.name}
                            </Badge>
                        </WrapItem>
                    )}
                    {topic.subject?.name && (
                        <WrapItem>
                            <Badge bg="bg.optionSelected" color="text.primary" px={2} py={0.5} borderRadius="md">
                                {topic.subject.name}
                            </Badge>
                        </WrapItem>
                    )}
                </Wrap>
                <Heading as="h3" size="lg" id="detalle-tema">
                    {topic.name}
                </Heading>
            </Stack>

            {isSample && <SampleDataNotice />}

            {!hasCurricularInfo && (
                <EmptyState
                    title="Este tema aún no tiene información curricular"
                    description="El catálogo no registra descripción, competencias ni indicadores de logro para este tema."
                />
            )}

            {hasCurricularInfo && (
                <>
                    <Section icon={FiFileText} title="Descripción">
                        {description ? <Text whiteSpace="pre-line">{description}</Text> : <Missing>El catálogo no incluye una descripción para este tema.</Missing>}
                    </Section>

                    <Section icon={FiAward} title="Competencias">
                        {competencies.length ? (
                            <List spacing={2}>
                                {competencies.map((competency, index) => (
                                    <ListItem key={competency.code ?? index} display="flex" gap={3} alignItems="flex-start" bg="bg.option" px={3} py={2} borderRadius="md">
                                        {competency.code && <CodeTag>{competency.code}</CodeTag>}
                                        <Text>{competency.description}</Text>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Missing>No hay competencias registradas para este tema.</Missing>
                        )}
                    </Section>

                    <Section icon={FiCheckSquare} title="Indicadores de logro">
                        {indicators.length ? (
                            <List spacing={2}>
                                {indicators.map((indicator, index) => (
                                    <ListItem key={indicator.code ?? index} display="flex" gap={3} alignItems="flex-start" bg="bg.option" px={3} py={2} borderRadius="md">
                                        {indicator.code && <CodeTag>{indicator.code}</CodeTag>}
                                        <Box>
                                            <Text>{indicator.description}</Text>
                                            {indicator.competencyCode && (
                                                <Text fontSize="xs" mt={1}>
                                                    Competencia {indicator.competencyCode}
                                                </Text>
                                            )}
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Missing>No hay indicadores de logro registrados para este tema.</Missing>
                        )}
                    </Section>
                </>
            )}

            <Section icon={FiBookmark} title="Referencia curricular">
                {referenceRows.length || referenceUrl ? (
                    <Box as="dl" display="grid" gridTemplateColumns="max-content 1fr" columnGap={4} rowGap={1} fontSize="sm">
                        {referenceRows.map(([key, label]) => (
                            <Box key={key} display="contents">
                                <Text as="dt" fontWeight="semibold" color="text.primary">
                                    {label}
                                </Text>
                                <Text as="dd">{reference[key]}</Text>
                            </Box>
                        ))}
                        {referenceUrl && (
                            <Box display="contents">
                                <Text as="dt" fontWeight="semibold" color="text.primary">
                                    Enlace
                                </Text>
                                <Text as="dd">
                                    <Link href={referenceUrl} isExternal>
                                        Abrir documento <Icon as={FiExternalLink} mx={1} aria-hidden />
                                    </Link>
                                </Text>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Missing>El catálogo no registra la referencia curricular de este tema.</Missing>
                )}
                {topic.source?.type && (
                    <Text fontSize="xs">
                        Origen del dato: {SOURCE_LABELS[topic.source.type] ?? topic.source.type}
                        {topic.source.document ? ` — ${topic.source.document}` : ''}
                        {topic.source.version ? ` (${topic.source.version})` : ''}
                    </Text>
                )}
            </Section>
        </Stack>
    )
}
