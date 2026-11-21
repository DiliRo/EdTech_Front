import { Box, Stack, Text, VStack } from '@chakra-ui/react'
import { NAV_ITEMS } from './navigation.js'
import { NavItem } from './NavItem.jsx'
import { BrandLogo } from '../ui/BrandLogo.jsx'
import { APP_TAGLINE } from '../../utils/constants.js'

/** Contenido del menú lateral; se usa fijo en escritorio y dentro de un Drawer en móvil. */
export const SidebarContent = ({ onNavigate }) => (
    <Stack h="full" bg="bg.sidebar" px={3} py={6} spacing={8}>
        <Box px={3}>
            <BrandLogo onDark />
            <Text mt={2} fontSize="xs" color="text.onDarkMuted">
                {APP_TAGLINE}
            </Text>
        </Box>
        <VStack as="nav" aria-label="Menú principal" align="stretch" spacing={1}>
            {NAV_ITEMS.map((item) => (
                <NavItem key={item.to} {...item} onNavigate={onNavigate} />
            ))}
        </VStack>
    </Stack>
)

export const SIDEBAR_WIDTH = '280px'

/** Menú lateral fijo, visible desde pantallas medianas. */
export const Sidebar = () => (
    <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        position="fixed"
        insetY={0}
        left={0}
        w={SIDEBAR_WIDTH}
        overflowY="auto"
    >
        <SidebarContent />
    </Box>
)
