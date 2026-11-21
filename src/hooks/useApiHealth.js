import { useAsync } from './useAsync.js'
import { getHealth } from '../services/health.service.js'

/** Estado del servidor y la base de datos (GET /api/health). */
export const useApiHealth = () => useAsync(getHealth, { immediate: true })
