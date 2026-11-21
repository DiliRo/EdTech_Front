import { useState } from 'react'
import { Button, Heading, Input, Link, Select, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FormField } from '../components/ui/FormField.jsx'
import { PasswordInput } from '../components/ui/PasswordInput.jsx'
import { PendingFeatureNotice } from '../components/ui/PendingFeatureNotice.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { validateEmail, validateName, validateNewPassword, collectErrors } from '../utils/validation.js'
import { LANGUAGES, ROUTES } from '../utils/constants.js'

const INITIAL = { firstName: '', lastName: '', email: '', password: '', preferredLanguage: 'es' }

/**
 * Registro de docentes (solo interfaz). Los campos coinciden con POST /api/auth/register:
 * firstName, lastName, email, password y preferredLanguage. La conexión se hace en el siguiente módulo.
 */
export const RegisterPage = () => {
    useDocumentTitle('Crear cuenta')
    const [values, setValues] = useState(INITIAL)
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
            firstName: validateName(values.firstName, 'El nombre'),
            lastName: validateName(values.lastName, 'El apellido'),
            email: validateEmail(values.email),
            password: validateNewPassword(values.password)
        })
        setErrors(found)
        setSubmitted(Object.keys(found).length === 0)
    }

    return (
        <Stack as="form" spacing={5} onSubmit={handleSubmit} noValidate>
            <Stack spacing={1}>
                <Heading as="h1" size="lg">
                    Crear cuenta
                </Heading>
                <Text>Solo los docentes tienen cuenta. Los estudiantes se registran después con un código.</Text>
            </Stack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormField id="firstName" label="Nombre" error={errors.firstName} isRequired>
                    <Input autoComplete="given-name" value={values.firstName} onChange={update('firstName')} />
                </FormField>
                <FormField id="lastName" label="Apellido" error={errors.lastName} isRequired>
                    <Input autoComplete="family-name" value={values.lastName} onChange={update('lastName')} />
                </FormField>
            </SimpleGrid>

            <FormField id="email" label="Correo electrónico" error={errors.email} isRequired>
                <Input type="email" autoComplete="email" value={values.email} onChange={update('email')} />
            </FormField>

            <FormField
                id="password"
                label="Contraseña"
                error={errors.password}
                helper="Mínimo 8 caracteres, con mayúscula, minúscula y número."
                isRequired
            >
                <PasswordInput autoComplete="new-password" value={values.password} onChange={update('password')} />
            </FormField>

            <FormField id="preferredLanguage" label="Idioma preferido">
                <Select value={values.preferredLanguage} onChange={update('preferredLanguage')}>
                    {LANGUAGES.map((language) => (
                        <option key={language.code} value={language.code}>
                            {language.name}
                        </option>
                    ))}
                </Select>
            </FormField>

            {submitted && (
                <PendingFeatureNotice>
                    Los datos son válidos. El registro se conectará con el servidor en el siguiente módulo.
                </PendingFeatureNotice>
            )}

            <Button type="submit" size="lg" w="full">
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
