import { Box, Button, Flex, IconButton, Text } from '@chakra-ui/react'
import { FiLogOut, FiMenu } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from '../ui/BrandLogo.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { ROUTES } from '../../utils/constants.js'

/** Encabezado superior: botón de menú (móvil), logotipo en móvil y acciones de sesión. */
export const Header = ({ onOpenMenu }) => {
    const { isAuthenticated, clearSession } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        clearSession()
        navigate(ROUTES.login)
    }

    return (
        <Flex
            as="header"
            position="sticky"
            top={0}
            zIndex="sticky"
            align="center"
            justify="space-between"
            gap={3}
            px={{ base: 4, md: 8 }}
            py={3}
            bg="bg.header"
            borderBottomWidth="1px"
            borderColor="border.subtle"
        >
            <Flex align="center" gap={2}>
                <IconButton
                    display={{ base: 'inline-flex', lg: 'none' }}
                    variant="ghost"
                    aria-label="Abrir menú"
                    icon={<FiMenu size={22} />}
                    onClick={onOpenMenu}
                />
                <Box display={{ base: 'block', lg: 'none' }}>
                    <BrandLogo size="sm" />
                </Box>
                <Text display={{ base: 'none', lg: 'block' }} fontWeight="semibold" color="text.primary">
                    Panel docente
                </Text>
            </Flex>

            {isAuthenticated ? (
                <Button size="sm" variant="secondary" leftIcon={<FiLogOut />} onClick={handleLogout}>
                    Cerrar sesión
                </Button>
            ) : (
                <Button size="sm" variant="primary" onClick={() => navigate(ROUTES.login)}>
                    Iniciar sesión
                </Button>
            )}
        </Flex>
    )
}
