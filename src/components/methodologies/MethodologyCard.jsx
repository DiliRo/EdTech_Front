import { Card, CardBody, CardFooter, Flex, Heading, Icon, LinkBox, LinkOverlay, Stack, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { FiClock, FiPackage } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { MethodologyTypeTag } from './MethodologyTypeTag.jsx'
import { SelectMethodologyButton } from './SelectMethodologyButton.jsx'
import { useGuidePlanning } from '../../hooks/useGuidePlanning.js'
import { formatDuration, preferenceLabel } from '../../utils/methodology.js'
import { ROUTES } from '../../utils/constants.js'

const MAX_MATERIALS = 3

/**
 * Tarjeta de metodología: nombre, tipo, descripción breve, duración y materiales principales.
 * Predeterminadas con borde lateral navy sólido; personalizadas con borde turquesa discontinuo.
 */
export const MethodologyCard = ({ methodology, preferences = [] }) => {
    const { isSelected } = useGuidePlanning()
    const selected = isSelected(methodology.id)
    const duration = formatDuration(methodology.estimatedDuration)
    const materials = methodology.materials ?? []

    return (
        <Card
            as={LinkBox}
            h="full"
            bg={methodology.isDefault ? 'bg.surface' : 'bg.option'}
            borderWidth="2px"
            borderStyle={methodology.isDefault ? 'solid' : 'dashed'}
            borderColor={selected ? 'border.selected' : 'border.subtle'}
            borderLeftWidth="6px"
            borderLeftStyle="solid"
            borderLeftColor={methodology.isDefault ? 'border.strong' : 'turquoise.600'}
            boxShadow={selected ? '0 0 0 2px var(--chakra-colors-navy-500)' : undefined}
        >
            <CardBody pb={2}>
                <Stack spacing={3}>
                    <Flex justify="space-between" align="flex-start" gap={2} wrap="wrap">
                        <MethodologyTypeTag isDefault={methodology.isDefault} />
                    </Flex>
                    <Heading as="h2" size="md">
                        <LinkOverlay as={RouterLink} to={ROUTES.methodologyDetail(methodology.id)}>
                            {methodology.name}
                        </LinkOverlay>
                    </Heading>
                    <Text noOfLines={3}>{methodology.description}</Text>
                    <Flex align="center" gap={2} fontSize="sm">
                        <Icon as={FiClock} aria-hidden />
                        <Text as="span">{duration ? `Duración: ${duration}` : 'Duración no indicada'}</Text>
                    </Flex>
                    <Flex align="flex-start" gap={2} fontSize="sm">
                        <Icon as={FiPackage} mt={1} aria-hidden />
                        <Text as="span">
                            {materials.length
                                ? `Materiales: ${materials.slice(0, MAX_MATERIALS).join(', ')}${materials.length > MAX_MATERIALS ? ` y ${materials.length - MAX_MATERIALS} más` : ''}`
                                : 'Sin materiales indicados'}
                        </Text>
                    </Flex>
                    {methodology.learningPreferences?.length > 0 && (
                        <Wrap spacing={1.5} aria-label="Preferencias que puede favorecer">
                            {methodology.learningPreferences.map((code) => (
                                <WrapItem key={code}>
                                    <Tag size="sm" bg="bg.inputHover" color="text.primary" borderWidth="1px" borderColor="border.subtle">
                                        {preferenceLabel(code, preferences)}
                                    </Tag>
                                </WrapItem>
                            ))}
                        </Wrap>
                    )}
                </Stack>
            </CardBody>
            <CardFooter pt={2} position="relative" zIndex={1}>
                <SelectMethodologyButton methodology={methodology} />
            </CardFooter>
        </Card>
    )
}
