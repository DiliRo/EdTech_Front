import { FiHome, FiUsers, FiBookOpen, FiFileText, FiClipboard, FiTrendingUp } from 'react-icons/fi'
import { ROUTES } from '../../utils/constants.js'

/**
 * Elementos del menú lateral. `available: false` marca los módulos que todavía no tienen
 * interfaz; se muestran con la etiqueta "Próximamente" y abren una página informativa.
 */
export const NAV_ITEMS = Object.freeze([
    { label: 'Inicio', to: ROUTES.dashboard, icon: FiHome, available: true },
    { label: 'Aulas', to: ROUTES.classrooms, icon: FiUsers, available: false },
    { label: 'Metodologías', to: ROUTES.methodologies, icon: FiBookOpen, available: false },
    { label: 'Guías de clase', to: ROUTES.lessonGuides, icon: FiFileText, available: false },
    { label: 'Evaluaciones', to: ROUTES.assessments, icon: FiClipboard, available: false },
    { label: 'Seguimiento', to: ROUTES.experiments, icon: FiTrendingUp, available: false }
])
