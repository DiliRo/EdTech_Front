import { Button, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { BrandLogo } from '../components/ui/BrandLogo.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { ROUTES } from '../utils/constants.js'

export const NotFoundPage = () => {
    useDocumentTitle('Página no encontrada')
    return (
        <Flex minH="100vh" bg="bg.app" align="center" justify="center" px={4}>
            <Stack spacing={4} align="center" textAlign="center" maxW="md">
                <BrandLogo />
                <Heading as="h1" size="xl">
                    Página no encontrada
                </Heading>
                <Text>La dirección que buscas no existe o fue movida.</Text>
                <Button as={RouterLink} to={ROUTES.dashboard}>
                    Ir al inicio
                </Button>
            </Stack>
        </Flex>
    )
}

export default NotFoundPage
