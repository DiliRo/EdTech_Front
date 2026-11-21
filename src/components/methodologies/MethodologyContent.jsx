import { Box, Flex, Heading, Icon, Link, List, ListItem, OrderedList, SimpleGrid, Stack, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { FiActivity, FiBookOpen, FiExternalLink, FiList, FiPackage, FiTarget } from 'react-icons/fi'
import { formatDuration, preferenceLabel } from '../../utils/methodology.js'

const safeUrl = (value) => {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
    } catch {
        return null
    }
}

const Section = ({ icon, title, children }) => (
    <Stack as="section" aria-label={title} spacing={3}>
        <Flex align="center" gap={2}>
            <Icon as={icon} boxSize={5} color="text.primary" aria-hidden />
            <Heading as="h2" size="md">
                {title}
            </Heading>
        </Flex>
        {children}
    </Stack>
)

const Missing = ({ children }) => (
    <Text fontSize="sm" fontStyle="italic" bg="bg.surfaceMuted" px={3} py={2} borderRadius="md">
        {children}
    </Text>
)

const Fact = ({ label, children }) => (
    <Box bg="bg.option" px={4} py={3} borderRadius="lg" borderLeftWidth="4px" borderLeftColor="border.strong">
        <Text as="dt" fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="bold" color="text.primary">
            {label}
        </Text>
        <Box as="dd" mt={1}>
            {children}
        </Box>
    </Box>
)

const TagList = ({ items, empty }) =>
    items.length ? (
        <Wrap spacing={1.5}>
            {items.map((item) => (
                <WrapItem key={item.key}>
                    <Tag size="sm" bg="bg.optionSelected" color="text.primary">
                        {item.label}
                    </Tag>
                </WrapItem>
            ))}
        </Wrap>
    ) : (
        <Text>{empty}</Text>
    )

/** Datos generales de la metodología: duración, compatibilidad y preferencias. */
export const MethodologyFacts = ({ methodology, preferences = [] }) => (
    <Box as="dl">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <Fact label="Duración estimada">{formatDuration(methodology.estimatedDuration) ?? 'No indicada'}</Fact>
            <Fact label="Grados">
                <TagList items={(methodology.compatibleGrades ?? []).map((g) => ({ key: g.id ?? g, label: g.name ?? g }))} empty="Aplicable a cualquier grado" />
            </Fact>
            <Fact label="Materias">
                <TagList items={(methodology.compatibleSubjects ?? []).map((s) => ({ key: s.id ?? s, label: s.name ?? s }))} empty="Aplicable a cualquier materia" />
            </Fact>
            <Fact label="Preferencias que puede favorecer">
                <TagList
                    items={(methodology.learningPreferences ?? []).map((code) => ({ key: code, label: preferenceLabel(code, preferences) }))}
                    empty="No indicadas"
                />
            </Fact>
        </SimpleGrid>
    </Box>
)

/**
 * Objetivos, pasos, actividades, materiales y fuente, tal como los devuelve GET /api/methodologies/:id.
 * Si la metodología no indica algo se dice explícitamente; no se completa con contenido inventado.
 */
export const MethodologyContent = ({ methodology }) => {
    const objectives = methodology.objectives ?? []
    const steps = methodology.steps ?? []
    const activities = methodology.suggestedActivities ?? []
    const materials = methodology.materials ?? []
    const source = methodology.sourceReference
    const sourceUrl = source?.url ? safeUrl(source.url) : null

    return (
        <Stack spacing={8}>
            <Section icon={FiTarget} title="Objetivos">
                {objectives.length ? (
                    <List spacing={2}>
                        {objectives.map((objective, index) => (
                            <ListItem key={index} bg="bg.option" px={4} py={2} borderRadius="md">
                                {objective}
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Missing>Esta metodología no indica objetivos.</Missing>
                )}
            </Section>

            <Section icon={FiList} title="Pasos">
                {steps.length ? (
                    <OrderedList spacing={3} ml={0} styleType="none">
                        {steps.map((step, index) => (
                            <ListItem key={index} display="flex" gap={3} alignItems="flex-start">
                                <Flex
                                    flexShrink={0}
                                    boxSize={8}
                                    borderRadius="full"
                                    bg="bg.sidebar"
                                    color="text.onDark"
                                    align="center"
                                    justify="center"
                                    fontWeight="bold"
                                    aria-hidden
                                >
                                    {index + 1}
                                </Flex>
                                <Box bg="bg.option" px={4} py={2} borderRadius="md" flex="1">
                                    <Text as="span" srOnly>
                                        Paso {index + 1}.{' '}
                                    </Text>
                                    {step.title && (
                                        <Text fontWeight="bold" color="text.primary">
                                            {step.title}
                                        </Text>
                                    )}
                                    <Text>{step.description}</Text>
                                </Box>
                            </ListItem>
                        ))}
                    </OrderedList>
                ) : (
                    <Missing>Esta metodología no describe pasos.</Missing>
                )}
            </Section>

            <Section icon={FiActivity} title="Actividades sugeridas">
                {activities.length ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {activities.map((activity, index) => (
                            <Box key={index} bg="bg.option" px={4} py={3} borderRadius="md" borderTopWidth="3px" borderTopColor="border.strong">
                                <Heading as="h3" size="sm">
                                    {activity.title}
                                </Heading>
                                {activity.description && <Text mt={1}>{activity.description}</Text>}
                            </Box>
                        ))}
                    </SimpleGrid>
                ) : (
                    <Missing>Esta metodología no sugiere actividades.</Missing>
                )}
            </Section>

            <Section icon={FiPackage} title="Materiales y recursos">
                {materials.length ? (
                    <Wrap spacing={2}>
                        {materials.map((material, index) => (
                            <WrapItem key={index}>
                                <Tag bg="bg.option" color="text.primary" borderWidth="1px" borderColor="border.subtle" py={1.5}>
                                    {material}
                                </Tag>
                            </WrapItem>
                        ))}
                    </Wrap>
                ) : (
                    <Missing>Esta metodología no indica materiales.</Missing>
                )}
            </Section>

            <Section icon={FiBookOpen} title="Fuente">
                {source && Object.values(source).some(Boolean) ? (
                    <Stack spacing={1} fontSize="sm" bg="bg.option" px={4} py={3} borderRadius="md">
                        {source.title && (
                            <Text fontWeight="bold" color="text.primary">
                                {source.title}
                            </Text>
                        )}
                        {(source.institution || source.year) && <Text>{[source.institution, source.year].filter(Boolean).join(', ')}</Text>}
                        {(source.section || source.pages) && (
                            <Text>{[source.section && `Sección ${source.section}`, source.pages && `pág. ${source.pages}`].filter(Boolean).join(' · ')}</Text>
                        )}
                        {sourceUrl && (
                            <Link href={sourceUrl} isExternal fontWeight="semibold">
                                Abrir documento <Icon as={FiExternalLink} mx={1} aria-hidden />
                            </Link>
                        )}
                        {source.notes && (
                            <Text mt={2} fontStyle="italic">
                                {source.notes}
                            </Text>
                        )}
                    </Stack>
                ) : (
                    <Missing>No se indicó una fuente.</Missing>
                )}
            </Section>
        </Stack>
    )
}
