import { apiClient } from './apiClient.js'

/**
 * Metodologías de enseñanza (módulo B5 del backend).
 *
 *   GET    /api/methodologies?scope=all|default|mine&grade=&subject=&maxDuration=&learningPreferences=a,b
 *   GET    /api/methodologies/:id
 *   POST   /api/methodologies          (solo personalizadas)
 *   PATCH  /api/methodologies/:id      (solo las propias; las predeterminadas responden 403)
 *   DELETE /api/methodologies/:id      archivado lógico de una propia
 *
 * El listado incluye en `meta.learningPreferences` el catálogo de preferencias con sus etiquetas.
 */

/** Campos que el backend acepta para una metodología personalizada. */
export const METHODOLOGY_FIELDS = Object.freeze([
    'name',
    'description',
    'objectives',
    'steps',
    'suggestedActivities',
    'materials',
    'estimatedDuration',
    'compatibleSubjects',
    'compatibleGrades',
    'learningPreferences',
    'sourceReference'
])

const pick = (data) => Object.fromEntries(METHODOLOGY_FIELDS.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]))

/**
 * @param {{ scope?: 'all'|'default'|'mine', grade?: string, subject?: string, maxDuration?: number, learningPreferences?: string[] }} filters
 * @returns {Promise<{ methodologies: object[], learningPreferences: Array<{ code: string, label: string }> }>}
 */
export const listMethodologies = async ({ scope = 'all', grade, subject, maxDuration, learningPreferences } = {}) => {
    const params = { scope }
    if (grade) params.grade = grade
    if (subject) params.subject = subject
    if (maxDuration) params.maxDuration = maxDuration
    if (learningPreferences?.length) params.learningPreferences = learningPreferences.join(',')
    const { data } = await apiClient.get('/methodologies', { params })
    return { methodologies: data.data.methodologies, learningPreferences: data.meta?.learningPreferences ?? [] }
}

/** Catálogo de preferencias de aprendizaje del backend (viene en el `meta` del listado). */
export const getLearningPreferences = async () => (await listMethodologies({ scope: 'mine' })).learningPreferences

export const getMethodology = async (id) => {
    const { data } = await apiClient.get(`/methodologies/${encodeURIComponent(id)}`)
    return data.data.methodology
}

export const createMethodology = async (fields) => {
    const { data } = await apiClient.post('/methodologies', pick(fields))
    return data.data.methodology
}

export const updateMethodology = async (id, changes) => {
    const body = pick(changes)
    if (typeof changes.isActive === 'boolean') body.isActive = changes.isActive
    const { data } = await apiClient.patch(`/methodologies/${encodeURIComponent(id)}`, body)
    return data.data.methodology
}

export const archiveMethodology = async (id) => {
    const { data } = await apiClient.delete(`/methodologies/${encodeURIComponent(id)}`)
    return data.data.methodology
}

export const restoreMethodology = (id) => updateMethodology(id, { isActive: true })
