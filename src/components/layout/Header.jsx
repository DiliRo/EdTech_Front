import { Avatar, Box, Button, Flex, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text } from '@chakra-ui/react'
import { FiChevronDown, FiLogOut, FiMenu, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from '../ui/BrandLogo.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { ROUTES } from '../../utils/constants.js'

/** Encabezado: botón de menú (móvil), logotipo en móvil y menú del docente. */
export const Header = ({ onOpenMenu }) => {
    const { teacher, logout } = useAuth()
    const navigate = useNavigate()
    const fullName = teacher ? `${teacher.firstName} ${teacher.lastName}` : ''

    const handleLogout = () => {
        logout()
        navigate(ROUTES.login, { replace: true })
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

            <Menu placement="bottom-end">
                <MenuButton as={Button} variant="ghost" px={2} rightIcon={<FiChevronDown />} aria-label={`Menú de ${fullName}`}>
                    <Flex align="center" gap={2}>
                        <Avatar size="sm" name={fullName} />
                        <Text as="span" display={{ base: 'none', md: 'inline' }} color="text.primary" noOfLines={1} maxW="200px">
                            {fullName}
                        </Text>
                    </Flex>
                </MenuButton>
                <MenuList>
                    <Box px={3} py={2}>
                        <Text fontWeight="semibold" color="text.primary">
                            {fullName}
                        </Text>
                        <Text fontSize="sm">{teacher?.email}</Text>
                    </Box>
                    <MenuDivider />
                    <MenuItem icon={<FiUser />} onClick={() => navigate(ROUTES.profile)}>
                        Mi perfil
                    </MenuItem>
                    <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                        Cerrar sesión
                    </MenuItem>
                </MenuList>
            </Menu>
        </Flex>
    )
}
