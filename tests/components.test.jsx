import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input, Text } from '@chakra-ui/react'
import { renderWithTheme } from './renderWithProviders.jsx'
import { LoadingState } from '../src/components/feedback/LoadingState.jsx'
import { ErrorState } from '../src/components/feedback/ErrorState.jsx'
import { EmptyState } from '../src/components/feedback/EmptyState.jsx'
import { AsyncContent } from '../src/components/feedback/AsyncContent.jsx'
import { FormField } from '../src/components/ui/FormField.jsx'
import { PasswordInput } from '../src/components/ui/PasswordInput.jsx'

describe('Estados visuales', () => {
    it('carga: indicador accesible con mensaje', () => {
        renderWithTheme(<LoadingState message="Cargando aulas…" />)
        expect(screen.getByRole('status')).toHaveTextContent('Cargando aulas…')
    })

    it('error: muestra el mensaje y permite reintentar', async () => {
        const onRetry = vi.fn()
        renderWithTheme(<ErrorState error={{ message: 'Sin conexión' }} onRetry={onRetry} />)
        expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')
        await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('error sin reintento no muestra el botón', () => {
        renderWithTheme(<ErrorState error="Algo falló" />)
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('sin información: título y descripción', () => {
        renderWithTheme(<EmptyState title="Sin aulas" description="Crea tu primera aula." />)
        expect(screen.getByRole('heading', { name: 'Sin aulas' })).toBeInTheDocument()
        expect(screen.getByText('Crea tu primera aula.')).toBeInTheDocument()
    })
})

describe('AsyncContent', () => {
    const renderState = (state) =>
        renderWithTheme(
            <AsyncContent state={state} emptyTitle="Nada por aquí">
                {(data) => <Text>Datos: {data.join(', ')}</Text>}
            </AsyncContent>
        )

    it('muestra carga, error, vacío o contenido según el estado', () => {
        const { unmount } = renderState({ status: 'loading' })
        expect(screen.getByRole('status')).toBeInTheDocument()
        unmount()

        const error = renderState({ status: 'error', error: { message: 'Falló' } })
        expect(screen.getByRole('alert')).toHaveTextContent('Falló')
        error.unmount()

        const empty = renderState({ status: 'success', data: [] })
        expect(screen.getByText('Nada por aquí')).toBeInTheDocument()
        empty.unmount()

        renderState({ status: 'success', data: ['A01', 'A02'] })
        expect(screen.getByText('Datos: A01, A02')).toBeInTheDocument()
    })
})

describe('Formularios', () => {
    it('FormField asocia la etiqueta y muestra el error', () => {
        renderWithTheme(
            <FormField id="correo" label="Correo" error="Obligatorio">
                <Input />
            </FormField>
        )
        expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
        expect(screen.getByText('Obligatorio')).toBeInTheDocument()
    })

    it('PasswordInput alterna entre ocultar y mostrar', async () => {
        renderWithTheme(<PasswordInput aria-label="Contraseña" defaultValue="Secreta1" />)
        const input = screen.getByLabelText('Contraseña')
        expect(input).toHaveAttribute('type', 'password')
        await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
        expect(input).toHaveAttribute('type', 'text')
    })
})
