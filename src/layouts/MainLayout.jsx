import { Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerOverlay, useDisclosure } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import { Sidebar, SidebarContent, SIDEBAR_WIDTH } from '../components/layout/Sidebar.jsx'
import { Header } from '../components/layout/Header.jsx'

/**
 * Layout principal: menú lateral (fijo en escritorio, cajón en móvil), encabezado y contenido.
 */
export const MainLayout = () => {
    const menu = useDisclosure()

    return (
        <Box minH="100vh" bg="bg.app">
            <Sidebar />

            <Drawer isOpen={menu.isOpen} placement="left" onClose={menu.onClose}>
                <DrawerOverlay />
                <DrawerContent bg="bg.sidebar" maxW={SIDEBAR_WIDTH}>
                    <DrawerCloseButton color="text.onDark" aria-label="Cerrar menú" />
                    <DrawerBody p={0}>
                        <SidebarContent onNavigate={menu.onClose} />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            <Box ml={{ base: 0, lg: SIDEBAR_WIDTH }}>
                <Header onOpenMenu={menu.onOpen} />
                <Box as="main" id="contenido" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }} maxW="1200px">
                    <Outlet />
                </Box>
            </Box>
        </Box>
    )
}
