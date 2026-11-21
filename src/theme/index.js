import { extendTheme } from '@chakra-ui/react'
import { colors } from './colors.js'
import { semanticTokens } from './semanticTokens.js'
import * as components from './components/index.js'

/**
 * Tema de Etamanïk para Chakra UI v2. Centraliza colores, tipografía y estilos de componentes.
 * Solo modo claro: la paleta fue definida para el fondo turquesa.
 */
export const theme = extendTheme({
    config: { initialColorMode: 'light', useSystemColorMode: false },
    colors,
    semanticTokens,
    fonts: {
        heading: `'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif`,
        body: `'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif`
    },
    styles: {
        global: {
            'html, body, #root': { minHeight: '100%' },
            body: {
                bg: 'bg.app', // fondo principal obligatorio
                color: 'text.secondary',
                lineHeight: 'tall'
            },
            '::selection': { bg: 'navy.500', color: 'white' }
        }
    },
    // Copia a un objeto plano: extendTheme no fusiona un módulo (`import * as`) y reemplazaría
    // los estilos base de Chakra (tamaños, espaciados) en lugar de extenderlos.
    components: { ...components }
})

export default theme
