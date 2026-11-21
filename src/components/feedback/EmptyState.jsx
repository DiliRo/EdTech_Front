import { Flex, Heading, Icon, Text } from '@chakra-ui/react'
import { FiInbox } from 'react-icons/fi'

/** Ausencia de información: explica por qué no hay datos y, si aplica, qué hacer. */
export const EmptyState = ({ title = 'Aún no hay información', description, icon = FiInbox, action }) => (
    <Flex
        direction="column"
        align="center"
        textAlign="center"
        gap={2}
        py={8}
        px={4}
        bg="bg.surfaceMuted"
        borderRadius="lg"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor="border.subtle"
    >
        <Icon as={icon} boxSize={8} color="text.primary" aria-hidden />
        <Heading as="h3" size="sm">
            {title}
        </Heading>
        {description && <Text maxW="md">{description}</Text>}
        {action}
    </Flex>
)
