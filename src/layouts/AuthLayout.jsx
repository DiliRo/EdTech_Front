import { Box, Card, CardBody, Flex, Text } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import { BrandLogo } from '../components/ui/BrandLogo.jsx'
import { APP_TAGLINE } from '../utils/constants.js'

/** Layout de acceso (inicio de sesión y registro): tarjeta turquesa centrada sobre el fondo principal. */
export const AuthLayout = () => (
    <Flex minH="100vh" bg="bg.app" align="center" justify="center" px={4} py={10}>
        <Box w="full" maxW="lg">
            <Flex direction="column" align="center" mb={6} textAlign="center">
                <BrandLogo />
                <Text mt={2} color="text.secondary" fontWeight="medium">
                    {APP_TAGLINE}
                </Text>
            </Flex>
            <Card as="main" id="contenido">
                <CardBody p={{ base: 6, md: 8 }}>
                    <Outlet />
                </CardBody>
            </Card>
        </Box>
    </Flex>
)
