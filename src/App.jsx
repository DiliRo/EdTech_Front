import { ChakraProvider } from '@chakra-ui/react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { theme } from './theme/index.js'
import { AuthProvider } from './context/AuthContext.jsx'
import { GuidePlanningProvider } from './context/GuidePlanningContext.jsx'
import { routes } from './router.jsx'

const router = createBrowserRouter(routes)

export const App = () => (
    <ChakraProvider theme={theme}>
        <AuthProvider>
            <GuidePlanningProvider>
                <RouterProvider router={router} />
            </GuidePlanningProvider>
        </AuthProvider>
    </ChakraProvider>
)

export default App
