export const APP_NAME = 'Etamanïk'
export const APP_TAGLINE = 'Apoyo pedagógico para docentes de primaria de Guatemala'

/** Rutas de la aplicación (un solo lugar para no repetir cadenas). */
export const ROUTES = Object.freeze({
    home: '/',
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    curriculum: '/curriculo',
    classrooms: '/aulas',
    classroomDetail: (id) => `/aulas/${encodeURIComponent(id)}`,
    methodologies: '/metodologias',
    lessonGuides: '/guias',
    assessments: '/evaluaciones',
    experiments: '/seguimiento',
    profile: '/perfil'
})

/**
 * Idiomas de la interfaz, con los mismos códigos que el backend (src/config/languages.js).
 * Los textos de la interfaz están en español; las traducciones se agregarán desde fuentes validadas.
 */
export const LANGUAGES = Object.freeze([
    { code: 'es', name: 'Español' },
    { code: 'kek', name: "Q'eqchi'" },
    { code: 'quc', name: "K'iche'" },
    { code: 'mam', name: 'Mam' },
    { code: 'cak', name: 'Kaqchikel' }
])
