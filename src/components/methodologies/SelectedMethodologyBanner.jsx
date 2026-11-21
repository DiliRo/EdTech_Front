import { Button, Flex, Icon, Link, Text } from '@chakra-ui/react'
import { FiCheckCircle } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { useGuidePlanning } from '../../hooks/useGuidePlanning.js'
import { ROUTES } from '../../utils/constants.js'

/** Recordatorio de la metodología elegida para la próxima guía de clase. */
export const SelectedMethodologyBanner = () => {
    const { selectedMethodology, clearMethodology } = useGuidePlanning()
    if (!selectedMethodology) return null

    return (
        <Flex
            role="status"
            direction={{ base: 'column', md: 'row' }}
            align={{ md: 'center' }}
            justify="space-between"
            gap={3}
            bg="bg.optionSelected"
            borderWidth="2px"
            borderColor="border.strong"
            borderRadius="lg"
            px={4}
            py={3}
        >
            <Flex gap={3} align="flex-start">
                <Icon as={FiCheckCircle} boxSize={5} mt={0.5} color="text.primary" aria-hidden />
                <Text color="text.primary">
                    Metodología elegida para tu próxima guía de clase:{' '}
                    <Link as={RouterLink} to={ROUTES.methodologyDetail(selectedMethodology.id)} fontWeight="bold">
                        {selectedMethodology.name}
                    </Link>
                    <Text as="span" display="block" fontSize="sm" color="text.secondary">
                        Se usará al generar la guía en el módulo Guías de clase. Puedes cambiarla cuando quieras.
                    </Text>
                </Text>
            </Flex>
            <Button size="sm" variant="secondary" onClick={clearMethodology} flexShrink={0}>
                Quitar selección
            </Button>
        </Flex>
    )
}
