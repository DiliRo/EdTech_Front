import { useState } from 'react'
import { Button, Heading, Input, Link, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { FormField } from '../components/ui/FormField.jsx'
import { FormAlert } from '../components/ui/FormAlert.jsx'
import { PasswordInput } from '../components/ui/PasswordInput.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useFormState } from '../hooks/useFormState.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { validateEmail, validateRequired } from '../utils/validation.js'
import { ROUTES } from '../utils/constants.js'

/** Inicio de sesión del docente (POST /api/auth/login). */
export const LoginPage = () => {
    useDocumentTitle('Iniciar sesión')
    const { login, notice, clearNotice } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const form = useFormState({ email: '', password: '' })
    const [isSubmitting, setSubmitting] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        const valid = form.validate({
            email: validateEmail(form.values.email),
            password: validateRequired(form.values.password, 'La contraseña')
        })
        if (!valid) return

        setSubmitting(true)
        clearNotice()
        try {
            await login(form.values)
            // Vuelve a la página privada que se pidió antes de iniciar sesión
            navigate(location.state?.from?.pathname ?? ROUTES.dashboard, { replace: true })
        } catch (error) {
            // La contraseña no se conserva tras un intento fallido
            form.setValue('password', '')
            form.applyServerError(error)
            setSubmitting(false)
        }
    }

    return (
        <Stack as="form" spacing={5} onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
            <Stack spacing={1}>
                <Heading as="h1" id="login-title" size="lg">
                    Iniciar sesión
                </Heading>
                <Text>Ingresa con tu cuenta de docente.</Text>
            </Stack>

            {notice && <FormAlert status={notice.status}>{notice.message}</FormAlert>}
            <FormAlert>{form.formError}</FormAlert>

            <FormField id="email" label="Correo electrónico" error={form.errors.email} isRequired>
                <Input type="email" autoComplete="email" inputMode="email" {...form.field('email')} />
            </FormField>

            <FormField id="password" label="Contraseña" error={form.errors.password} isRequired>
                <PasswordInput autoComplete="current-password" {...form.field('password')} />
            </FormField>

            <Button type="submit" size="lg" w="full" isLoading={isSubmitting} loadingText="Ingresando…">
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
