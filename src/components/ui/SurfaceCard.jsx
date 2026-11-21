import { Card, CardBody, CardHeader, Flex, Heading, Icon, Text } from '@chakra-ui/react'

/**
 * Tarjeta sobre turquesa suave (nunca blanco). Base de los contenedores de la aplicación.
 */
export const SurfaceCard = ({ title, description, icon, actions, children, ...props }) => (
    <Card {...props}>
        {(title || actions) && (
            <CardHeader pb={children ? 2 : 5}>
                <Flex align="center" justify="space-between" gap={3}>
                    <Flex align="center" gap={2}>
                        {icon && <Icon as={icon} boxSize={5} color="text.primary" aria-hidden />}
                        <Heading as="h2" size="md">
                            {title}
                        </Heading>
                    </Flex>
                    {actions}
                </Flex>
                {description && (
                    <Text mt={1} fontSize="sm">
                        {description}
                    </Text>
                )}
            </CardHeader>
        )}
        {children && <CardBody pt={title ? 2 : 5}>{children}</CardBody>}
    </Card>
)
