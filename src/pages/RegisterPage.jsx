import { useState } from 'react'
import { Button, Heading, Input, Link, Select, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { FormField } from '../components/ui/FormField.jsx'
import { FormAlert } from '../components/ui/FormAlert.jsx'
import { PasswordInput } from '../components/ui/PasswordInput.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useFormState } from '../hooks/useFormState.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { validateEmail, validateName, validateNewPassword, validatePasswordConfirmation } from '../utils/validation.js'
import { LANGUAGES, ROUTES } from '../utils/constants.js'

const INITIAL = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', preferredLanguage: 'es' }

/**
 * Registro de docentes (POST /api/auth/register). Solo los docentes tienen cuenta.
 * La confirmación de contraseña se valida aquí y NO se envía al backend.
 */
export const RegisterPage = () => {
    useDocumentTitle('Crear cuenta')
    const { register } = useAuth()
    const navigate = useNavigate()
    const form = useFormState(INITIAL)
    const [isSubmitting, setSubmitting] = useState(false)
    const { values } = form

    const handleSubmit = async (event) => {
        event.preventDefault()
        const valid = form.validate({
            firstName: validateName(values.firstName, 'El nombre'),
            lastName: validateName(values.lastName, 'El apellido'),
            email: validateEmail(values.email),
            password: validateNewPassword(values.password),
            confirmPassword: validatePasswordConfirmation(values.password, values.confirmPassword)
        })
        if (!valid) return

        setSubmitting(true)
        try {
            const { confirmPassword: _confirmation, ...data } = values
            await register(data)
            navigate(ROUTES.dashboard, { replace: true })
        } catch (error) {
            form.applyServerError(error)
            setSubmitting(false)
        }
    }

    return (
        <Stack as="form" spacing={5} onSubmit={handleSubmit} noValidate aria-labelledby="register-title">
            <Stack spacing={1}>
                <Heading as="h1" id="register-title" size="lg">
                    Crear cuenta de docente
                </Heading>
                <Text>Solo los docentes tienen cuenta. Los estudiantes se registran después, en tus aulas, con un código.</Text>
            </Stack>

            <FormAlert>{form.formError}</FormAlert>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormField id="firstName" label="Nombre" error={form.errors.firstName} isRequired>
                    <Input autoComplete="given-name" {...form.field('firstName')} />
                </FormField>
                <FormField id="lastName" label="Apellido" error={form.errors.lastName} isRequired>
                    <Input autoComplete="family-name" {...form.field('lastName')} />
                </FormField>
            </SimpleGrid>

            <FormField id="email" label="Correo electrónico" error={form.errors.email} isRequired>
                <Input type="email" autoComplete="email" inputMode="email" {...form.field('email')} />
            </FormField>

            <FormField
                id="password"
                label="Contraseña"
                error={form.errors.password}
                helper="Mínimo 8 caracteres, con mayúscula, minúscula y número."
                isRequired
            >
                <PasswordInput autoComplete="new-password" {...form.field('password')} />
            </FormField>

            <FormField id="confirmPassword" label="Confirmar contraseña" error={form.errors.confirmPassword} isRequired>
                <PasswordInput autoComplete="new-password" {...form.field('confirmPassword')} />
            </FormField>

            <FormField id="preferredLanguage" label="Idioma preferido" helper="Puedes cambiarlo después en tu perfil.">
                <Select {...form.field('preferredLanguage')}>
                    {LANGUAGES.map((language) => (
                        <option key={language.code} value={language.code}>
                            {language.name}
                        </option>
                    ))}
                </Select>
            </FormField>

            <Button type="submit" size="lg" w="full" isLoading={isSubmitting} loadingText="Creando cuenta…">
                Crear cuenta
            </Button>

            <Text textAlign="center">
                ¿Ya tienes cuenta?{' '}
                <Link as={RouterLink} to={ROUTES.login}>
                    Inicia sesión
                </Link>
            </Text>
        </Stack>
    )
}

export default RegisterPage
