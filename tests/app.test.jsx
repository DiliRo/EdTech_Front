import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './renderWithProviders.jsx'
import { tokenStorage } from '../src/utils/tokenStorage.js'
import { NAV_ITEMS } from '../src/components/layout/navigation.js'
import { mockApi, fakeToken, TEACHER, ok, healthy, networkError } from './mockApi.js'

/** Sesión válida guardada y backend que la reconoce. */
const signedIn = (extraRoutes = {}) => {
    tokenStorage.set(fakeToken())
    return mockApi({
        'GET /auth/me': () => ok({ teacher: TEACHER }),
        'GET /health': healthy,
        ...extraRoutes
    })
}

describe('Panel (con sesión)', () => {
    it('la raíz redirige al panel', async () => {
        signedIn()
        const { router } = renderRoute('/')
        await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    })

    it('el panel tiene menú lateral, encabezado, contenido y saluda al docente', async () => {
        signedIn()
        renderRoute('/dashboard')
        expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByRole('main')).toBeInTheDocument()

        const nav = screen.getAllByRole('navigation', { name: 'Menú principal' })[0]
        for (const item of NAV_ITEMS) {
            expect(within(nav).getByRole('link', { name: new RegExp(item.label) })).toHaveAttribute('href', item.to)
        }
    })

    it('muestra el estado real del servidor y permite reintentar si falla', async () => {
        let healthCalls = 0
        signedIn({ 'GET /health': () => (++healthCalls === 1 ? networkError() : healthy()) })
        renderRoute('/dashboard')
        expect(await screen.findByText('No se pudo contactar al servidor')).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
        expect(await screen.findByText('En línea')).toBeInTheDocument()
        expect(screen.getByText('Todavía no hay aulas para mostrar')).toBeInTheDocument()
    })

    it('los módulos pendientes abren una página informativa', async () => {
        signedIn()
        renderRoute('/aulas')
        expect(await screen.findByText('Módulo en preparación')).toBeInTheDocument()
    })

    it('una ruta desconocida muestra la página 404', async () => {
        renderRoute('/no-existe')
        expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    })
})
