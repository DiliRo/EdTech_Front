import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './renderWithProviders.jsx'
import { tokenStorage } from '../src/utils/tokenStorage.js'
import { NAV_ITEMS } from '../src/components/layout/navigation.js'

vi.mock('../src/services/health.service.js', () => ({ getHealth: vi.fn() }))
const { getHealth } = await import('../src/services/health.service.js')

beforeEach(() => {
    getHealth.mockReset()
    getHealth.mockResolvedValue({ healthy: true, server: 'ok', database: 'connected' })
})

describe('Navegación y layout principal', () => {
    it('la raíz redirige al panel', async () => {
        const { router } = renderRoute('/')
        await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    })

    it('el panel tiene menú lateral, encabezado y contenido', async () => {
        renderRoute('/dashboard')
        expect(await screen.findByRole('heading', { name: 'Panel principal' })).toBeInTheDocument()
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByRole('main')).toBeInTheDocument()

        const nav = screen.getAllByRole('navigation', { name: 'Menú principal' })[0]
        for (const item of NAV_ITEMS) {
            expect(within(nav).getByRole('link', { name: new RegExp(item.label) })).toHaveAttribute('href', item.to)
        }
        expect(within(nav).getAllByText('Próximamente')).toHaveLength(NAV_ITEMS.filter((i) => !i.available).length)
    })

    it('muestra el estado real del servidor sin datos académicos de ejemplo', async () => {
        renderRoute('/dashboard')
        expect(await screen.findByText('En línea')).toBeInTheDocument()
        expect(screen.getByText('Conectada')).toBeInTheDocument()
        expect(screen.getByText('Todavía no hay aulas para mostrar')).toBeInTheDocument()
        expect(screen.getByText('Todavía no hay guías para mostrar')).toBeInTheDocument()
    })

    it('si el servidor no responde muestra el error y permite reintentar', async () => {
        getHealth.mockRejectedValueOnce({ isApiError: true, message: 'No se pudo conectar con el servidor.' })
        renderRoute('/dashboard')
        expect(await screen.findByText('No se pudo contactar al servidor')).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
        expect(await screen.findByText('En línea')).toBeInTheDocument()
        expect(getHealth).toHaveBeenCalledTimes(2)
    })

    it('los módulos pendientes abren una página informativa', async () => {
        renderRoute('/aulas')
        expect(await screen.findByRole('heading', { name: 'Aulas' })).toBeInTheDocument()
        expect(screen.getByText('Módulo en preparación')).toBeInTheDocument()
    })

    it('una ruta desconocida muestra la página 404', async () => {
        renderRoute('/no-existe')
        expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    })

    it('con sesión muestra "Cerrar sesión", que borra el token y lleva al inicio de sesión', async () => {
        tokenStorage.set('token-123')
        const { router } = renderRoute('/dashboard')
        await userEvent.click(await screen.findByRole('button', { name: /cerrar sesión/i }))
        expect(tokenStorage.get()).toBeNull()
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    })
})

describe('Inicio de sesión (solo interfaz)', () => {
    it('valida los campos antes de enviar', async () => {
        renderRoute('/login')
        await userEvent.click(await screen.findByRole('button', { name: 'Ingresar' }))
        expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument()
        expect(screen.getByText('La contraseña es obligatorio')).toBeInTheDocument()
    })

    it('con datos válidos avisa que la conexión llega en el siguiente módulo', async () => {
        renderRoute('/login')
        await userEvent.type(await screen.findByLabelText(/correo electrónico/i), 'ana@escuela.edu.gt')
        await userEvent.type(screen.getByLabelText(/^contraseña/i), 'Clave2026')
        await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
        expect(screen.getByText(/se conectará con el servidor en el siguiente módulo/)).toBeInTheDocument()
        expect(tokenStorage.get()).toBeNull()
    })

    it('enlaza al registro', async () => {
        const { router } = renderRoute('/login')
        await userEvent.click(await screen.findByRole('link', { name: 'Regístrate' }))
        expect(router.state.location.pathname).toBe('/register')
    })
})

describe('Registro (solo interfaz)', () => {
    it('aplica las mismas reglas de contraseña que el backend', async () => {
        renderRoute('/register')
        await userEvent.type(await screen.findByLabelText(/^nombre/i), 'Ana')
        await userEvent.type(screen.getByLabelText(/^apellido/i), "Q'uq")
        await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'ana@escuela.edu.gt')
        await userEvent.type(screen.getByLabelText(/^contraseña/i), 'clave2026')
        await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
        expect(screen.getByText('La contraseña debe incluir una letra mayúscula')).toBeInTheDocument()
    })

    it('ofrece los cinco idiomas del backend', async () => {
        renderRoute('/register')
        const select = await screen.findByLabelText('Idioma preferido')
        const options = within(select).getAllByRole('option').map((o) => o.value)
        expect(options).toEqual(['es', 'kek', 'quc', 'mam', 'cak'])
    })

    it('rechaza nombres con números', async () => {
        renderRoute('/register')
        await userEvent.type(await screen.findByLabelText(/^nombre/i), 'Ana123')
        await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
        expect(screen.getByText(/solo puede contener letras/)).toBeInTheDocument()
    })
})
