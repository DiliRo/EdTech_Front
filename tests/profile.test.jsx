import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './renderWithProviders.jsx'
import { tokenStorage } from '../src/utils/tokenStorage.js'
import { mockApi, fakeToken, TEACHER, ok, fail, healthy } from './mockApi.js'

const openProfile = (patchHandler) => {
    tokenStorage.set(fakeToken())
    const calls = mockApi({
        'GET /auth/me': () => ok({ teacher: TEACHER }),
        'GET /health': healthy,
        ...(patchHandler ? { 'PATCH /teachers/me': patchHandler } : {})
    })
    renderRoute('/perfil')
    return calls
}

describe('Perfil del docente', () => {
    it('muestra los datos actuales; el correo es de solo lectura', async () => {
        openProfile()
        expect(await screen.findByLabelText(/^nombre/i)).toHaveValue('Ana')
        expect(screen.getByLabelText(/^apellido/i)).toHaveValue('Ixcot')
        expect(screen.getByLabelText('Idioma preferido')).toHaveValue('es')
        const email = screen.getByLabelText('Correo electrónico')
        expect(email).toHaveValue('ana.ixcot@escuela.edu.gt')
        expect(email).toHaveAttribute('readonly')
        expect(screen.getByText(/Cuenta creada el/)).toBeInTheDocument()
    })

    it('envía solo los campos cambiados y actualiza el nombre en el encabezado', async () => {
        const calls = openProfile(({ body }) => ok({ teacher: { ...TEACHER, ...body } }, 'Perfil actualizado'))
        const u = userEvent.setup()
        const lastName = await screen.findByLabelText(/^apellido/i)
        await u.clear(lastName)
        await u.type(lastName, 'Cac Pop')
        await u.selectOptions(screen.getByLabelText('Idioma preferido'), 'mam')
        await u.click(screen.getByRole('button', { name: 'Guardar cambios' }))

        expect(await screen.findByText('Tu perfil se actualizó correctamente.')).toBeInTheDocument()
        const patch = calls.find((c) => c.method === 'PATCH')
        expect(patch).toMatchObject({ url: '/teachers/me', body: { lastName: 'Cac Pop', preferredLanguage: 'mam' } })
        expect(patch.body).not.toHaveProperty('email')
        expect(patch.body).not.toHaveProperty('firstName')
        expect(within(screen.getByRole('banner')).getAllByText('Ana Cac Pop').length).toBeGreaterThan(0)
    })

    it('sin cambios no llama al backend', async () => {
        const calls = openProfile(() => ok({ teacher: TEACHER }))
        await userEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }))
        expect(screen.getByText('No hay cambios para guardar.')).toBeInTheDocument()
        expect(calls.some((c) => c.method === 'PATCH')).toBe(false)
    })

    it('valida el nombre antes de enviar', async () => {
        openProfile(() => ok({ teacher: TEACHER }))
        const u = userEvent.setup()
        await u.clear(await screen.findByLabelText(/^nombre/i))
        await u.click(screen.getByRole('button', { name: 'Guardar cambios' }))
        expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    })

    it('muestra en el campo los errores de validación del backend', async () => {
        openProfile(() => fail(400, 'Errores de validación', [{ field: 'firstName', message: 'El nombre no puede superar 60 caracteres' }]))
        const u = userEvent.setup()
        const firstName = await screen.findByLabelText(/^nombre/i)
        await u.type(firstName, ' María')
        await u.click(screen.getByRole('button', { name: 'Guardar cambios' }))
        expect(await screen.findByText('El nombre no puede superar 60 caracteres')).toBeInTheDocument()
        expect(firstName).toHaveAttribute('aria-invalid', 'true')
    })

    it('se puede abrir desde el menú lateral', async () => {
        openProfile()
        const link = (await screen.findAllByRole('link', { name: /mi perfil/i }))[0]
        expect(link).toHaveAttribute('href', '/perfil')
    })
})
