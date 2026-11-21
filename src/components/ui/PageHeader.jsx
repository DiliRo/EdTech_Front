import { Flex, Heading, Stack, Text } from '@chakra-ui/react'

/** Encabezado de página: título, descripción opcional y acciones a la derecha. */
export const PageHeader = ({ title, description, actions }) => (
    <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={4}
        mb={6}
    >
        <Stack spacing={1}>
            <Heading as="h1" size="lg">
                {title}
            </Heading>
            {description && <Text fontSize="md">{description}</Text>}
        </Stack>
        {actions && <Flex gap={2} wrap="wrap">{actions}</Flex>}
    </Flex>
)
