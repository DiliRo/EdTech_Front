/**
 * Tokens semánticos: nombres por FUNCIÓN (fondo de la app, superficie, texto principal…).
 * Los componentes usan estos nombres, así un cambio de paleta se hace en un solo lugar.
 */
export const semanticTokens = {
    colors: {
        // Fondos
        'bg.app': 'turquoise.500', // fondo principal obligatorio
        'bg.surface': 'turquoise.300', // tarjetas y contenedores
        'bg.surfaceMuted': 'turquoise.400', // secciones dentro de tarjetas, filas alternas
        'bg.input': 'turquoise.200', // campos de formulario
        'bg.inputHover': 'turquoise.100',
        'bg.sidebar': 'navy.500',
        'bg.sidebarHover': 'navy.400',
        'bg.sidebarActive': 'navy.700',
        'bg.header': 'turquoise.400',
        // Opciones seleccionables (grados, materias, temas)
        'bg.option': 'turquoise.200',
        'bg.optionHover': 'turquoise.100',
        'bg.optionSelected': 'turquoise.500', // turquesa más intenso + borde navy = seleccionado

        // Texto
        'text.primary': 'navy.500', // títulos, encabezados, texto destacado
        'text.secondary': 'slate.500', // descripciones y etiquetas
        'text.onDark': 'white', // texto sobre el menú lateral y botones oscuros
        'text.onDarkMuted': 'navy.100',

        // Bordes y foco
        'border.subtle': 'turquoise.600',
        'border.strong': 'navy.500',
        'border.selected': 'navy.500',
        'focus.ring': 'navy.400',

        // Estados
        'status.error': 'danger.500',
        'status.errorBg': 'danger.100',
        'status.success': 'success.500',
        'status.successBg': 'success.100',
        'status.warning': 'warning.500',
        'status.warningBg': 'warning.100'
    }
}
