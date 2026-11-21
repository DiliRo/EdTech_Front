import { apiClient } from './apiClient.js'

/**
 * Evaluaciones y seguimiento académico (módulo B6 del backend). Todo es del docente autenticado:
 * evaluaciones, aulas o estudiantes ajenos responden 404.
 *
 *   GET  /api/assessments?classroomId=&subjectId=&assessmentType=&from=&to=
 *   POST /api/assessments                         { title, classroomId, subjectId, topicId?, teachingMethodId?, assessmentDate, maxScore, assessmentType }
 *   GET  /api/assessments/:id                     evaluación + calificaciones + estudiantes sin calificación + resumen
 *   POST /api/assessments/:id/results             { results: [{ studentId, score, observations?, correctionReason? }] }
 *   GET  /api/classrooms/:id/performance?subjectId=&from=&to=&threshold=
 *   GET  /api/students/:id/results?subjectId=&from=&to=
 *   GET  /api/students/:id/progress?subjectId=&from=&to=&threshold=
 *
 * Reglas del backend que la interfaz respeta:
 *  - Una calificación faltante NO es cero: al estudiante sin nota simplemente no se le envía.
 *  - Las calificaciones se relacionan por `studentId`; el código solo se muestra.
 *  - La nota máxima no se puede cambiar después de crear la evaluación.
 */

/** Máximo de calificaciones por petición que acepta el backend. */
export const MAX_RESULTS_PER_REQUEST = 200

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))

export const listAssessments = async (filters = {}) => {
    const { data } = await apiClient.get('/assessments', { params: clean(filters) })
    return data.data.assessments
}

/** @returns {Promise<{ assessment, results, pendingStudents, summary, note }>} */
export const getAssessment = async (id) => {
    const { data } = await apiClient.get(`/assessments/${encodeURIComponent(id)}`)
    return { ...data.data, note: data.meta?.note ?? null }
}

export const createAssessment = async ({ title, classroomId, subjectId, topicId, teachingMethodId, assessmentDate, maxScore, assessmentType }) => {
    const body = clean({ title, classroomId, subjectId, topicId, teachingMethodId, assessmentDate, maxScore, assessmentType })
    const { data } = await apiClient.post('/assessments', body)
    return data.data.assessment
}

/**
 * Registra o corrige calificaciones. Si hay más de MAX_RESULTS_PER_REQUEST se envían en partes
 * (el backend valida cada parte completa antes de guardar).
 * @returns {Promise<{ summary: { created, updated, unchanged }, results: object[] }>}
 */
export const recordResults = async (assessmentId, entries) => {
    const total = { created: 0, updated: 0, unchanged: 0 }
    const results = []
    for (let start = 0; start < entries.length; start += MAX_RESULTS_PER_REQUEST) {
        const chunk = entries.slice(start, start + MAX_RESULTS_PER_REQUEST).map(({ studentId, score, observations, correctionReason }) =>
            clean({ studentId, score, observations, correctionReason })
        )
        const { data } = await apiClient.post(`/assessments/${encodeURIComponent(assessmentId)}/results`, { results: chunk })
        for (const key of Object.keys(total)) total[key] += data.data.summary[key] ?? 0
        results.push(...data.data.results)
    }
    return { summary: total, results }
}

export const getClassroomPerformance = async (classroomId, { subjectId, from, to, threshold } = {}) => {
    const { data } = await apiClient.get(`/classrooms/${encodeURIComponent(classroomId)}/performance`, {
        params: clean({ subjectId, from, to, threshold })
    })
    return { ...data.data, note: data.meta?.note ?? null }
}

export const getStudentResults = async (studentId, { subjectId, from, to } = {}) => {
    const { data } = await apiClient.get(`/students/${encodeURIComponent(studentId)}/results`, { params: clean({ subjectId, from, to }) })
    return data.data
}

export const getStudentProgress = async (studentId, { subjectId, from, to, threshold } = {}) => {
    const { data } = await apiClient.get(`/students/${encodeURIComponent(studentId)}/progress`, {
        params: clean({ subjectId, from, to, threshold })
    })
    return { ...data.data, note: data.meta?.note ?? null }
}
