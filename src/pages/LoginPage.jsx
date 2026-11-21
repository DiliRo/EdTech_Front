import { useState } from 'react'
import { Button, Heading, Input, Link, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FormField } from '../components/ui/FormField.jsx'
import { PasswordInput } from '../components/ui/PasswordInput.jsx'
import { PendingFeatureNotice } from '../components/ui/PendingFeatureNotice.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { validateEmail, validateRequired, collectErrors } from '../utils/validation.js'
import { ROUTES } from '../utils/constants.js'

/**
 * Inicio de sesión del docente (solo interfaz).
 * La conexión con POST /api/auth/login se implementa en el siguiente módulo.
 */
export const LoginPage = () => {
    useDocumentTitle('Iniciar sesión')
    const [values, setValues] = useState({ email: '', password: '' })
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)

    const update = (field) => (event) => {
        setValues((v) => ({ ...v, [field]: event.target.value }))
        setErrors((e) => ({ ...e, [field]: undefined }))
        setSubmitted(false)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        const found = collectErrors({
            email: validateEmail(values.email),
            password: validateRequired(values.password, 'La contraseña')
        })
        setErrors(found)
        setSubmitted(Object.keys(found).length === 0)
    }

    return (
        <Stack as="form" spacing={5} onSubmit={handleSubmit} noValidate>
            <Stack spacing={1}>
                <Heading as="h1" size="lg">
                    Iniciar sesión
                </Heading>
                <Text>Ingresa con tu cuenta de docente.</Text>
            </Stack>

            <FormField id="email" label="Correo electrónico" error={errors.email} isRequired>
                <Input type="email" autoComplete="email" value={values.email} onChange={update('email')} />
            </FormField>

            <FormField id="password" label="Contraseña" error={errors.password} isRequired>
                <PasswordInput autoComplete="current-password" value={values.password} onChange={update('password')} />
            </FormField>

            {submitted && (
                <PendingFeatureNotice>
                    Los datos son válidos. El inicio de sesión se conectará con el servidor en el siguiente módulo.
                </PendingFeatureNotice>
            )}

            <Button type="submit" size="lg" w="full">
                Ingresar
            </Button>

            <Text textAlign="center">
                ¿No tienes cuenta?{' '}
                <Link as={RouterLink} to={ROUTES.register}>
                    Regístrate
                </Link>
            </Text>
        </Stack>
    )
}

export default LoginPage
