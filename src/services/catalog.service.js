import { apiClient } from './apiClient.js'

/**
 * Catálogo curricular (módulo B3 del backend). Solo lectura; requiere sesión de docente.
 *
 *   GET /api/grades?level=primaria
 *   GET /api/subjects?grade=<gradeId>
 *   GET /api/topics?grade=<gradeId>&subject=<subjectId>&page=<n>&limit=<1..100>
 *   GET /api/topics/:id
 *
 * Las respuestas no se modifican: solo se extraen `data` y `meta`. `containsSampleData` indica
 * que algún registro es de PRUEBA (no proviene del CNB) y debe avisarse en la interfaz.
 */

/** Nivel educativo que cubre la plataforma (el backend solo acepta `primaria`). */
export const EDUCATION_LEVEL = 'primaria'

/** Límite máximo de temas por página que acepta el backend. */
export const TOPICS_PAGE_LIMIT = 100

/** Tope de páginas al cargar todos los temas de una materia (100 × 20 = 2000 temas). */
const MAX_TOPIC_PAGES = 20

/** @returns {Promise<Array<{ id: string, number: number, name: string, level: string }>>} */
export const getGrades = async ({ level = EDUCATION_LEVEL } = {}) => {
    const { data } = await apiClient.get('/grades', { params: { level } })
    return data.data.grades
}

/** Materias que se imparten en un grado. */
export const getSubjects = async ({ grade } = {}) => {
    const { data } = await apiClient.get('/subjects', { params: grade ? { grade } : {} })
    return { subjects: data.data.subjects, containsSampleData: data.meta?.containsSampleData === true }
}

/** Una página de temas filtrados por grado y materia. */
export const getTopics = async ({ grade, subject, page = 1, limit = TOPICS_PAGE_LIMIT } = {}) => {
    const params = { page, limit }
    if (grade) params.grade = grade
    if (subject) params.subject = subject
    const { data } = await apiClient.get('/topics', { params })
    const { containsSampleData, ...pagination } = data.meta ?? {}
    return { topics: data.data.topics, pagination, containsSampleData: containsSampleData === true }
}

/**
 * Todos los temas de una materia en un grado, recorriendo las páginas del backend.
 * @returns {Promise<{ topics: object[], total: number, containsSampleData: boolean, isTruncated: boolean }>}
 */
export const getAllTopics = async ({ grade, subject }) => {
    const topics = []
    let containsSampleData = false
    let page = 1
    let totalPages
    let total
    do {
        const result = await getTopics({ grade, subject, page, limit: TOPICS_PAGE_LIMIT })
        topics.push(...result.topics)
        containsSampleData ||= result.containsSampleData
        totalPages = result.pagination.totalPages ?? 1
        total = result.pagination.total ?? topics.length
        page += 1
    } while (page <= totalPages && page <= MAX_TOPIC_PAGES)
    return { topics, total, containsSampleData, isTruncated: topics.length < total }
}

/** Detalle de un tema: descripción, competencias, indicadores de logro y referencia curricular. */
export const getTopic = async (id) => {
    const { data } = await apiClient.get(`/topics/${encodeURIComponent(id)}`)
    return { topic: data.data.topic, containsSampleData: data.meta?.containsSampleData === true }
}
