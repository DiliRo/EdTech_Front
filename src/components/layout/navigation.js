import { FiHome, FiUsers, FiBookOpen, FiFileText, FiClipboard, FiTrendingUp, FiUser, FiLayers } from 'react-icons/fi'
import { ROUTES } from '../../utils/constants.js'

/**
 * Elementos del menú lateral. `available: false` marca los módulos que todavía no tienen
 * interfaz; se muestran con la etiqueta "Próximamente" y abren una página informativa.
 */
export const NAV_ITEMS = Object.freeze([
    { label: 'Inicio', to: ROUTES.dashboard, icon: FiHome, available: true },
    { label: 'Currículo', to: ROUTES.curriculum, icon: FiLayers, available: true },
    { label: 'Aulas', to: ROUTES.classrooms, icon: FiUsers, available: true },
    { label: 'Metodologías', to: ROUTES.methodologies, icon: FiBookOpen, available: true },
    { label: 'Guías de clase', to: ROUTES.lessonGuides, icon: FiFileText, available: false },
    { label: 'Evaluaciones', to: ROUTES.assessments, icon: FiClipboard, available: true },
    { label: 'Seguimiento', to: ROUTES.experiments, icon: FiTrendingUp, available: false },
    { label: 'Mi perfil', to: ROUTES.profile, icon: FiUser, available: true }
])
