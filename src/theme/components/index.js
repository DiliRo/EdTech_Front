/**
 * Estilos de componentes de Chakra UI v2. Todos usan tokens semánticos.
 */
import { cardAnatomy, alertAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers, defineStyleConfig } from '@chakra-ui/react'

export const Button = defineStyleConfig({
    baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        _focusVisible: { boxShadow: '0 0 0 3px var(--chakra-colors-focus-ring)' }
    },
    variants: {
        // Botón principal: navy con texto blanco
        primary: {
            bg: 'bg.sidebar',
            color: 'text.onDark',
            _hover: { bg: 'navy.400', _disabled: { bg: 'bg.sidebar' } },
            _active: { bg: 'navy.700' }
        },
        // Botón secundario: contorno navy sobre turquesa
        secondary: {
            bg: 'transparent',
            color: 'text.primary',
            border: '2px solid',
            borderColor: 'border.strong',
            _hover: { bg: 'bg.surfaceMuted' },
            _active: { bg: 'turquoise.600' }
        },
        ghost: {
            color: 'text.primary',
            _hover: { bg: 'bg.surfaceMuted' },
            _active: { bg: 'turquoise.600' }
        },
        link: { color: 'text.primary', fontWeight: 'semibold', textDecoration: 'underline' }
    },
    defaultProps: { variant: 'primary' }
})

export const Heading = defineStyleConfig({
    baseStyle: { color: 'text.primary', fontWeight: 'bold' }
})

export const Text = defineStyleConfig({
    baseStyle: { color: 'text.secondary' }
})

export const FormLabel = defineStyleConfig({
    baseStyle: { color: 'text.primary', fontWeight: 'semibold', mb: 1 }
})

export const FormError = {
    baseStyle: { text: { color: 'status.error', fontWeight: 'medium' }, icon: { color: 'status.error' } }
}

const field = {
    bg: 'bg.input',
    color: 'text.primary',
    borderWidth: '2px',
    borderColor: 'border.subtle',
    _hover: { bg: 'bg.inputHover' },
    _placeholder: { color: 'slate.400' },
    _focusVisible: { borderColor: 'border.strong', bg: 'bg.inputHover', boxShadow: 'none' },
    _invalid: { borderColor: 'status.error', boxShadow: 'none' }
}

export const Input = {
    variants: { etamanik: { field, addon: { bg: 'bg.surfaceMuted', color: 'text.primary' } } },
    defaultProps: { variant: 'etamanik' }
}

export const Select = {
    variants: { etamanik: { field, icon: { color: 'text.primary' } } },
    defaultProps: { variant: 'etamanik' }
}

export const Textarea = {
    variants: { etamanik: field },
    defaultProps: { variant: 'etamanik' }
}

const card = createMultiStyleConfigHelpers(cardAnatomy.keys)
export const Card = card.defineMultiStyleConfig({
    baseStyle: {
        container: {
            bg: 'bg.surface',
            color: 'text.secondary',
            borderRadius: 'xl',
            borderWidth: '1px',
            borderColor: 'border.subtle',
            boxShadow: 'sm'
        },
        header: { color: 'text.primary' }
    }
})

const alert = createMultiStyleConfigHelpers(alertAnatomy.keys)
const alertStatus = (color, bg) => ({
    container: { bg, color, borderLeftWidth: '4px', borderLeftColor: color, borderRadius: 'md' },
    icon: { color },
    title: { color },
    description: { color }
})
export const Alert = alert.defineMultiStyleConfig({
    variants: {
        etamanik: (props) => {
            const map = {
                error: alertStatus('status.error', 'status.errorBg'),
                success: alertStatus('status.success', 'status.successBg'),
                warning: alertStatus('status.warning', 'status.warningBg'),
                info: alertStatus('text.primary', 'bg.surfaceMuted'),
                loading: alertStatus('text.primary', 'bg.surfaceMuted')
            }
            return map[props.status] ?? map.info
        }
    },
    defaultProps: { variant: 'etamanik' }
})

export const Spinner = defineStyleConfig({
    baseStyle: { color: 'text.primary' }
})

export const Link = defineStyleConfig({
    baseStyle: { color: 'text.primary', fontWeight: 'semibold', textDecoration: 'underline' }
})

export const Divider = defineStyleConfig({
    baseStyle: { borderColor: 'border.subtle', opacity: 1 }
})
