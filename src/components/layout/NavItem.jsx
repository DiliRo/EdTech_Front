import { Badge, Flex, Icon, Stack, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'

/** Enlace del menú lateral (texto blanco sobre navy; el activo se resalta). */
export const NavItem = ({ to, icon, label, available = true, onNavigate }) => (
    <Flex
        as={NavLink}
        to={to}
        onClick={onNavigate}
        align="center"
        gap={3}
        px={4}
        py={2.5}
        borderRadius="lg"
        color="text.onDark"
        fontWeight="medium"
        transition="background 0.15s"
        _hover={{ bg: 'bg.sidebarHover' }}
        _focusVisible={{ outline: '3px solid', outlineColor: 'turquoise.500', outlineOffset: '2px' }}
        sx={{
            '&.active': { bg: 'bg.sidebarActive', boxShadow: 'inset 4px 0 0 var(--chakra-colors-turquoise-500)' }
        }}
    >
        <Icon as={icon} boxSize={5} flexShrink={0} aria-hidden />
        <Stack spacing={0.5} minW={0} align="flex-start">
            <Text as="span" color="text.onDark" lineHeight="short">
                {label}
            </Text>
            {/* Debajo del nombre para que no se desborde en el menú */}
            {!available && (
                <Badge bg="turquoise.500" color="navy.500" fontSize="0.6rem" borderRadius="md" px={1.5}>
                    Próximamente
                </Badge>
            )}
        </Stack>
    </Flex>
)
