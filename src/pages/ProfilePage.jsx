import { useState } from 'react'
import { Button, Flex, Input, Select, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { FiUser } from 'react-icons/fi'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { FormField } from '../components/ui/FormField.jsx'
import { FormAlert } from '../components/ui/FormAlert.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useFormState } from '../hooks/useFormState.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { validateName } from '../utils/validation.js'
import { LANGUAGES } from '../utils/constants.js'
import { EDITABLE_PROFILE_FIELDS } from '../services/teacher.service.js'

const pickEditable = (teacher) => ({
    firstName: teacher?.firstName ?? '',
    lastName: teacher?.lastName ?? '',
    preferredLanguage: teacher?.preferredLanguage ?? 'es'
})

const formatDate = (value) =>
    value ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long' }).format(new Date(value)) : null

/**
 * Perfil del docente: nombre, apellido e idioma preferido (PATCH /api/teachers/me).
 * El correo se muestra pero no se edita: el backend no permite cambiarlo desde aquí.
 */
export const ProfilePage = () => {
    useDocumentTitle('Mi perfil')
    const { teacher, updateProfile } = useAuth()
    const form = useFormState(pickEditable(teacher))
    const [isSaving, setSaving] = useState(false)
    const [result, setResult] = useState(null) // { status, message }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setResult(null)
        const valid = form.validate({
            firstName: validateName(form.values.firstName, 'El nombre'),
            lastName: validateName(form.values.lastName, 'El apellido')
        })
        if (!valid) return

        const current = pickEditable(teacher)
        const changes = Object.fromEntries(
            EDITABLE_PROFILE_FIELDS.filter((field) => form.values[field].trim() !== current[field]).map((field) => [field, form.values[field]])
        )
        if (!Object.keys(changes).length) {
            setResult({ status: 'info', message: 'No hay cambios para guardar.' })
            return
        }

        setSaving(true)
        try {
            const updated = await updateProfile(changes)
            form.reset(pickEditable(updated))
            setResult({ status: 'success', message: 'Tu perfil se actualizó correctamente.' })
        } catch (error) {
            form.applyServerError(error)
        } finally {
            setSaving(false)
        }
    }

    const createdAt = formatDate(teacher?.createdAt)

    return (
        <Stack spacing={6}>
            <PageHeader title="Mi perfil" description="Actualiza tus datos personales y tu idioma preferido." />

            <SurfaceCard title="Datos personales" icon={FiUser} maxW="3xl">
                <Stack as="form" spacing={5} onSubmit={handleSubmit} noValidate aria-label="Datos personales">
                    {result && <FormAlert status={result.status}>{result.message}</FormAlert>}
                    <FormAlert>{form.formError}</FormAlert>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormField id="firstName" label="Nombre" error={form.errors.firstName} isRequired>
                            <Input autoComplete="given-name" {...form.field('firstName')} />
                        </FormField>
                        <FormField id="lastName" label="Apellido" error={form.errors.lastName} isRequired>
                            <Input autoComplete="family-name" {...form.field('lastName')} />
                        </FormField>
                    </SimpleGrid>

                    <FormField id="email" label="Correo electrónico" helper="El correo no se puede cambiar.">
                        <Input value={teacher?.email ?? ''} isReadOnly aria-readonly="true" bg="bg.surfaceMuted" />
                    </FormField>

                    <FormField
                        id="preferredLanguage"
                        label="Idioma preferido"
                        error={form.errors.preferredLanguage}
                        helper="Por ahora la interfaz está en español; las traducciones se agregarán a partir de fuentes validadas."
                    >
                        <Select {...form.field('preferredLanguage')}>
                            {LANGUAGES.map((language) => (
                                <option key={language.code} value={language.code}>
                                    {language.name}
                                </option>
                            ))}
                        </Select>
                    </FormField>

                    <Flex direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }} justify="space-between" gap={3}>
                        {createdAt ? <Text fontSize="sm">Cuenta creada el {createdAt}.</Text> : <span />}
                        <Button type="submit" isLoading={isSaving} loadingText="Guardando…">
                            Guardar cambios
                        </Button>
                    </Flex>
                </Stack>
            </SurfaceCard>
        </Stack>
    )
}

export default ProfilePage
