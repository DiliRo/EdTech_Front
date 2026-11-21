import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './renderWithProviders.jsx'
import { tokenStorage } from '../src/utils/tokenStorage.js'
import { mockApi, fakeToken, TEACHER, ok, fail, healthy, networkError } from './mockApi.js'

const user = () => userEvent.setup()
const storedValues = () => JSON.stringify({ ...window.sessionStorage }) + JSON.stringify({ ...window.localStorage })

afterEach(() => {
    vi.useRealTimers()
})

describe('Rutas protegidas', () => {
    it('sin sesión, una página privada redirige al inicio de sesión sin consultar el perfil', async () => {
        const calls = mockApi({})
        const { router } = renderRoute('/dashboard')
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(calls).toHaveLength(0)
    })

    it('con sesión, el inicio de sesión y el registro redirigen al panel', async () => {
        tokenStorage.set(fakeToken())
        mockApi({ 'GET /auth/me': () => ok({ teacher: TEACHER }), 'GET /health': healthy })
        const { router } = renderRoute('/login')
        await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    })
})

describe('Inicio de sesión', () => {
    it('valida antes de enviar y enfoca el primer campo con error', async () => {
        const calls = mockApi({})
        renderRoute('/login')
        await user().click(await screen.findByRole('button', { name: 'Ingresar' }))
        expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument()
        expect(screen.getByText('La contraseña es obligatorio')).toBeInTheDocument()
        expect(document.activeElement).toHaveAttribute('id', 'email')
        expect(calls).toHaveLength(0)
    })

    it('inicia sesión, guarda solo el token y vuelve a la página que se pidió', async () => {
        const token = fakeToken()
        const calls = mockApi({
            'POST /auth/login': () => ok({ teacher: TEACHER, token }, 'Inicio de sesión exitoso'),
            'GET /health': healthy
        })
        const { router } = renderRoute('/perfil')
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))

        const u = user()
        await u.type(screen.getByLabelText(/correo electrónico/i), '  ana.ixcot@escuela.edu.gt ')
        await u.type(screen.getByLabelText(/^contraseña/i), 'Clave2026')
        await u.click(screen.getByRole('button', { name: 'Ingresar' }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/perfil'))
        expect(calls[0]).toMatchObject({ method: 'POST', url: '/auth/login', body: { email: 'ana.ixcot@escuela.edu.gt', password: 'Clave2026' } })
        expect(tokenStorage.get()).toBe(token)
        expect(storedValues()).not.toContain('Clave2026')
        expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    })

    it('credenciales incorrectas: muestra el mensaje del backend, sin aviso de sesión expirada', async () => {
        mockApi({ 'POST /auth/login': () => fail(401, 'Correo o contraseña incorrectos') })
        renderRoute('/login')
        const u = user()
        await u.type(await screen.findByLabelText(/correo electrónico/i), 'ana@escuela.edu.gt')
        await u.type(screen.getByLabelText(/^contraseña/i), 'Mala1234')
        await u.click(screen.getByRole('button', { name: 'Ingresar' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
        expect(screen.queryByText(/sesión expiró/)).not.toBeInTheDocument()
        expect(screen.getByLabelText(/^contraseña/i)).toHaveValue('')
        expect(tokenStorage.get()).toBeNull()
    })

    it('demasiados intentos (429): muestra el mensaje del backend', async () => {
        mockApi({ 'POST /auth/login': () => fail(429, 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.') })
        renderRoute('/login')
        const u = user()
        await u.type(await screen.findByLabelText(/correo electrónico/i), 'ana@escuela.edu.gt')
        await u.type(screen.getByLabelText(/^contraseña/i), 'Clave2026')
        await u.click(screen.getByRole('button', { name: 'Ingresar' }))
        expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos')
    })

    it('sin conexión: mensaje claro, sin detalles técnicos', async () => {
        mockApi({ 'POST /auth/login': () => networkError() })
        renderRoute('/login')
        const u = user()
        await u.type(await screen.findByLabelText(/correo electrónico/i), 'ana@escuela.edu.gt')
        await u.type(screen.getByLabelText(/^contraseña/i), 'Clave2026')
        await u.click(screen.getByRole('button', { name: 'Ingresar' }))
        const alert = await screen.findByRole('alert')
        expect(alert).toHaveTextContent('No se pudo conectar con el servidor')
        expect(alert).not.toHaveTextContent(/Network Error|ERR_|HTTP/)
    })
})

describe('Registro', () => {
    const fill = async (u, overrides = {}) => {
        const v = { firstName: 'Ana', lastName: "Q'uq", email: 'ana@escuela.edu.gt', password: 'Clave2026', confirmPassword: 'Clave2026', ...overrides }
        await u.type(await screen.findByLabelText(/^nombre/i), v.firstName)
        await u.type(screen.getByLabelText(/^apellido/i), v.lastName)
        await u.type(screen.getByLabelText(/correo electrónico/i), v.email)
        await u.type(screen.getByLabelText(/^contraseña/i), v.password)
        if (v.confirmPassword) await u.type(screen.getByLabelText(/confirmar contraseña/i), v.confirmPassword)
    }

    it('exige confirmar la contraseña y que coincida', async () => {
        const calls = mockApi({})
        renderRoute('/register')
        const u = user()
        await fill(u, { confirmPassword: 'Clave2027' })
        await u.click(screen.getByRole('button', { name: 'Crear cuenta' }))
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
        expect(calls).toHaveLength(0)
    })

    it('aplica las reglas de contraseña del backend', async () => {
        mockApi({})
        renderRoute('/register')
        const u = user()
        await fill(u, { password: 'clave2026', confirmPassword: 'clave2026' })
        await u.click(screen.getByRole('button', { name: 'Crear cuenta' }))
        expect(screen.getByText('La contraseña debe incluir una letra mayúscula')).toBeInTheDocument()
    })

    it('crea la cuenta sin enviar la confirmación, inicia sesión y saluda al docente', async () => {
        const token = fakeToken()
        const calls = mockApi({
            'POST /auth/register': () => ({ status: 201, body: { success: true, message: 'Cuenta creada correctamente', data: { teacher: TEACHER, token } } }),
            'GET /health': healthy
        })
        const { router } = renderRoute('/register')
        const u = user()
        await fill(u)
        await u.selectOptions(screen.getByLabelText('Idioma preferido'), 'kek')
        await u.click(screen.getByRole('button', { name: 'Crear cuenta' }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
        expect(calls[0].body).toEqual({ firstName: 'Ana', lastName: "Q'uq", email: 'ana@escuela.edu.gt', password: 'Clave2026', preferredLanguage: 'kek' })
        expect(tokenStorage.get()).toBe(token)
        expect(storedValues()).not.toContain('Clave2026')
        expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    })

    it('correo ya registrado (409): el error aparece en el campo de correo', async () => {
        mockApi({
            'POST /auth/register': () => fail(409, 'Ya existe una cuenta con ese correo', [{ field: 'email', message: 'Ya existe una cuenta con ese correo' }])
        })
        renderRoute('/register')
        const u = user()
        await fill(u)
        await u.click(screen.getByRole('button', { name: 'Crear cuenta' }))
        expect(await screen.findByText('Ya existe una cuenta con ese correo')).toBeInTheDocument()
        expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute('aria-invalid', 'true')
        expect(document.activeElement).toHaveAttribute('id', 'email')
    })

    it('ofrece los cinco idiomas del backend', async () => {
        mockApi({})
        renderRoute('/register')
        const options = [...(await screen.findByLabelText('Idioma preferido')).querySelectorAll('option')].map((o) => o.value)
        expect(options).toEqual(['es', 'kek', 'quc', 'mam', 'cak'])
    })
})

describe('Verificación y expiración de la sesión', () => {
    it('con un token guardado consulta /api/auth/me con Bearer', async () => {
        const token = fakeToken()
        tokenStorage.set(token)
        const calls = mockApi({ 'GET /auth/me': () => ok({ teacher: TEACHER }), 'GET /health': healthy })
        renderRoute('/dashboard')
        expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
        expect(calls[0]).toMatchObject({ method: 'GET', url: '/auth/me' })
        expect(calls[0].headers.Authorization).toBe(`Bearer ${token}`)
    })

    it('si /api/auth/me responde 401, cierra la sesión y avisa que expiró', async () => {
        tokenStorage.set(fakeToken())
        mockApi({ 'GET /auth/me': () => fail(401, 'Tu sesión expiró. Inicia sesión de nuevo.') })
        const { router } = renderRoute('/dashboard')
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(await screen.findByText('Tu sesión expiró. Inicia sesión de nuevo.')).toBeInTheDocument()
        expect(tokenStorage.get()).toBeNull()
    })

    it('un token ya vencido se descarta sin consultar al backend', async () => {
        tokenStorage.set(fakeToken({ expiresInSeconds: -60 }))
        const calls = mockApi({})
        const { router } = renderRoute('/dashboard')
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(screen.getByText('Tu sesión expiró. Inicia sesión de nuevo.')).toBeInTheDocument()
        expect(calls).toHaveLength(0)
        expect(tokenStorage.get()).toBeNull()
    })

    it('sin conexión al verificar la sesión permite reintentar sin perderla', async () => {
        tokenStorage.set(fakeToken())
        let attempts = 0
        mockApi({ 'GET /auth/me': () => (++attempts === 1 ? networkError() : ok({ teacher: TEACHER })), 'GET /health': healthy })
        renderRoute('/dashboard')
        expect(await screen.findByText('No se pudo verificar tu sesión')).toBeInTheDocument()
        expect(tokenStorage.get()).not.toBeNull()
        await user().click(screen.getByRole('button', { name: /reintentar/i }))
        expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    })

    it('si el backend rechaza el token durante el uso, vuelve al inicio de sesión', async () => {
        tokenStorage.set(fakeToken())
        mockApi({ 'GET /auth/me': () => ok({ teacher: TEACHER }), 'GET /health': () => fail(401, 'Sesión inválida. Inicia sesión de nuevo.') })
        const { router } = renderRoute('/dashboard')
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(await screen.findByText('Tu sesión expiró. Inicia sesión de nuevo.')).toBeInTheDocument()
    })

    it('cierra la sesión automáticamente cuando el token llega a su hora de expiración', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        tokenStorage.set(fakeToken({ expiresInSeconds: 30 }))
        mockApi({ 'GET /auth/me': () => ok({ teacher: TEACHER }), 'GET /health': healthy })
        const { router } = renderRoute('/dashboard')
        expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()

        await act(async () => {
            vi.advanceTimersByTime(31_000)
        })
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(screen.getByText('Tu sesión expiró. Inicia sesión de nuevo.')).toBeInTheDocument()
        expect(tokenStorage.get()).toBeNull()
    })
})

describe('Cierre de sesión', () => {
    it('desde el menú del docente borra el token y lo confirma', async () => {
        tokenStorage.set(fakeToken())
        mockApi({ 'GET /auth/me': () => ok({ teacher: TEACHER }), 'GET /health': healthy })
        const { router } = renderRoute('/dashboard')
        const u = user()
        await u.click(await screen.findByRole('button', { name: /menú de ana ixcot/i }))
        await u.click(await screen.findByRole('menuitem', { name: /cerrar sesión/i }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(screen.getByText('Cerraste sesión correctamente.')).toBeInTheDocument()
        expect(tokenStorage.get()).toBeNull()
    })
})
