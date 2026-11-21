/**
 * Estilos de componentes de Chakra UI v2. Todos usan tokens semánticos.
 */
import { cardAnatomy, alertAnatomy, menuAnatomy, avatarAnatomy, modalAnatomy, checkboxAnatomy, tableAnatomy } from '@chakra-ui/anatomy'
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

// Menú desplegable del docente: superficie turquesa, sin fondo blanco
const menu = createMultiStyleConfigHelpers(menuAnatomy.keys)
export const Menu = menu.defineMultiStyleConfig({
    baseStyle: {
        list: { bg: 'bg.surface', borderColor: 'border.subtle', borderWidth: '1px', boxShadow: 'lg', py: 2 },
        item: {
            bg: 'transparent',
            color: 'text.primary',
            fontWeight: 'medium',
            _hover: { bg: 'bg.surfaceMuted' },
            _focus: { bg: 'bg.surfaceMuted' }
        },
        divider: { borderColor: 'border.subtle', opacity: 1 }
    }
})

// Avatar con iniciales: navy con texto blanco
const avatar = createMultiStyleConfigHelpers(avatarAnatomy.keys)
export const Avatar = avatar.defineMultiStyleConfig({
    baseStyle: { container: { bg: 'bg.sidebar', color: 'text.onDark' } }
})

// Ventanas modales y diálogos de confirmación: superficie turquesa, nunca blanca
const modal = createMultiStyleConfigHelpers(modalAnatomy.keys)
export const Modal = modal.defineMultiStyleConfig({
    baseStyle: {
        overlay: { bg: 'rgba(23, 50, 77, 0.55)' },
        dialog: { bg: 'bg.surface', color: 'text.secondary', borderRadius: 'xl', borderWidth: '1px', borderColor: 'border.subtle', mx: 4 },
        header: { color: 'text.primary', fontSize: 'xl', fontWeight: 'bold' },
        closeButton: { color: 'text.primary', _hover: { bg: 'bg.surfaceMuted' } },
        footer: { gap: 3 }
    }
})

// Casillas: borde navy y relleno navy al marcar
const checkbox = createMultiStyleConfigHelpers(checkboxAnatomy.keys)
export const Checkbox = checkbox.defineMultiStyleConfig({
    baseStyle: {
        control: {
            borderColor: 'border.strong',
            bg: 'bg.input',
            _checked: { bg: 'bg.sidebar', borderColor: 'border.strong', color: 'text.onDark', _hover: { bg: 'bg.sidebarHover', borderColor: 'border.strong' } },
            _focusVisible: { boxShadow: '0 0 0 3px var(--chakra-colors-navy-300)' }
        },
        label: { color: 'text.secondary' }
    }
})

// Tablas: encabezado navy y filas alternas en turquesa suave
const table = createMultiStyleConfigHelpers(tableAnatomy.keys)
export const Table = table.defineMultiStyleConfig({
    variants: {
        etamanik: {
            table: { borderCollapse: 'separate', borderSpacing: 0 },
            th: {
                bg: 'bg.sidebar',
                color: 'text.onDark',
                fontSize: 'xs',
                letterSpacing: 'wider',
                textTransform: 'uppercase',
                py: 3,
                _first: { borderTopLeftRadius: 'md' },
                _last: { borderTopRightRadius: 'md' }
            },
            td: { color: 'text.secondary', py: 3, borderBottomWidth: '1px', borderColor: 'border.subtle' },
            tbody: {
                tr: {
                    '&:nth-of-type(odd)': { bg: 'bg.option' },
                    '&:nth-of-type(even)': { bg: 'bg.optionHover' }
                }
            }
        }
    },
    defaultProps: { variant: 'etamanik' }
})
