import { render } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { theme } from '../src/theme/index.js'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import { routes } from '../src/router.jsx'

/** Renderiza la aplicación completa en una ruta, con tema, sesión y router en memoria. */
export const renderRoute = (path = '/') => {
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    const utils = render(
        <ChakraProvider theme={theme}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </ChakraProvider>
    )
    return { ...utils, router }
}

/** Renderiza un componente suelto con el tema. */
export const renderWithTheme = (ui) => render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)
