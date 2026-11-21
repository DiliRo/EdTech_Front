/**
 * Paleta de Etamanïk. ÚNICA fuente de colores de la aplicación: los componentes usan
 * los tokens semánticos de `semanticTokens.js`, nunca valores hexadecimales sueltos.
 *
 * Colores obligatorios:
 *  - navy.500  #17324D  títulos, encabezados, menú lateral y botones principales
 *  - slate.500 #263238  texto secundario, descripciones y etiquetas
 *  - turquoise.500 #6FD1D7  fondo principal
 *
 * Las variantes del turquesa son mezclas del color base con blanco (más claras) o con negro
 * (más oscuras). Contrastes verificados en tests/theme.test.js (WCAG AA ≥ 4.5:1).
 */
export const colors = {
    navy: {
        50: '#E8ECF0',
        100: '#C5CED8',
        200: '#9FAEBF',
        300: '#7A8FA5',
        400: '#3A5168',
        500: '#17324D',
        600: '#132A41',
        700: '#0F2134',
        800: '#0B1927',
        900: '#07101A'
    },
    slate: {
        50: '#ECEFF1',
        100: '#CFD8DC',
        200: '#B0BEC5',
        300: '#90A4AE',
        400: '#546E7A',
        500: '#263238',
        600: '#20292E',
        700: '#192024',
        800: '#12181B',
        900: '#0B0F11'
    },
    turquoise: {
        50: '#E2F6F7',
        100: '#D4F1F3',
        200: '#C5EDEF',
        300: '#A9E3E7',
        400: '#8CDADF',
        500: '#6FD1D7',
        600: '#59A7AC',
        700: '#3D7376',
        800: '#2C5456',
        900: '#1E3A3C'
    },
    // Estados: tonos oscuros para que el texto sea legible sobre las superficies turquesa
    danger: { 500: '#8A1F11', 100: '#F3D9D5' },
    success: { 500: '#14532D', 100: '#D3EBDD' },
    warning: { 500: '#713F12', 100: '#F2E3CF' }
}
