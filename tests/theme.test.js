import { describe, it, expect } from 'vitest'
import { theme } from '../src/theme/index.js'
import { colors } from '../src/theme/colors.js'
import { semanticTokens } from '../src/theme/semanticTokens.js'

/** Resuelve un token semántico ("bg.app") o de paleta ("navy.500") a su valor hexadecimal. */
const resolve = (token) => {
    const semantic = semanticTokens.colors[token]
    const ref = semantic ?? token
    if (ref === 'white') return '#FFFFFF'
    if (ref.startsWith('#')) return ref
    const [scale, shade] = ref.split('.')
    return colors[scale][shade]
}

const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a, b) => {
    const [hi, lo] = [luminance(resolve(a)), luminance(resolve(b))].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}

describe('Paleta obligatoria', () => {
    it('usa exactamente los tres colores definidos', () => {
        expect(colors.navy[500]).toBe('#17324D')
        expect(colors.slate[500]).toBe('#263238')
        expect(colors.turquoise[500]).toBe('#6FD1D7')
    })

    it('el fondo principal es #6FD1D7', () => {
        expect(resolve('bg.app')).toBe('#6FD1D7')
        expect(theme.styles.global.body.bg).toBe('bg.app')
    })

    it('navy en menú lateral, títulos y botones principales; slate en texto secundario', () => {
        expect(resolve('bg.sidebar')).toBe('#17324D')
        expect(resolve('text.primary')).toBe('#17324D')
        expect(resolve('text.secondary')).toBe('#263238')
        expect(theme.components.Button.variants.primary.bg).toBe('bg.sidebar')
        expect(theme.components.Heading.baseStyle.color).toBe('text.primary')
    })

    it('ningún fondo usa blanco: las superficies son turquesa suave', () => {
        for (const [token, value] of Object.entries(semanticTokens.colors)) {
            if (token.startsWith('bg.')) {
                expect(value, token).not.toBe('white')
                expect(resolve(token), token).not.toBe('#FFFFFF')
            }
        }
        expect(resolve('bg.surface')).toBe(colors.turquoise[300])
    })
})

describe('Integración con los estilos base de Chakra UI v2', () => {
    it('extiende (no reemplaza) los estilos base de los componentes', () => {
        // Si los estilos personalizados reemplazaran a los de Chakra, se perderían tamaños y espaciados
        expect(theme.components.Button.sizes.md).toBeDefined()
        expect(theme.components.Heading.sizes.lg).toBeDefined()
        expect(theme.components.Input.sizes.md).toBeDefined()
        expect(theme.components.Card.sizes).toBeDefined()
        expect(theme.components.Alert.baseStyle).toBeDefined()
        // …y los personalizados siguen presentes
        expect(theme.components.Button.variants.primary).toBeDefined()
        expect(theme.components.Input.defaultProps.variant).toBe('etamanik')
    })
})

describe('Contraste (WCAG AA: 4.5:1 para texto normal)', () => {
    const pairs = [
        ['text.primary', 'bg.app'],
        ['text.secondary', 'bg.app'],
        ['text.primary', 'bg.surface'],
        ['text.secondary', 'bg.surface'],
        ['text.primary', 'bg.surfaceMuted'],
        ['text.secondary', 'bg.surfaceMuted'],
        ['text.primary', 'bg.input'],
        ['text.primary', 'bg.header'],
        ['text.onDark', 'bg.sidebar'],
        ['text.onDark', 'bg.sidebarHover'],
        ['text.onDark', 'bg.sidebarActive'],
        ['text.onDarkMuted', 'bg.sidebar'],
        ['status.error', 'status.errorBg'],
        ['status.error', 'bg.surface'],
        ['status.success', 'status.successBg'],
        ['status.warning', 'status.warningBg'],
        ['navy.500', 'turquoise.500'] // insignia "Próximamente" en el menú
    ]

    for (const [text, bg] of pairs) {
        it(`${text} sobre ${bg}`, () => {
            expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5)
        })
    }
})
