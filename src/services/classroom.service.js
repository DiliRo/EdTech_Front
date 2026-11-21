import { apiClient } from './apiClient.js'

/**
 * Aulas del docente autenticado (módulo B4 del backend). El backend solo devuelve aulas propias:
 * un aula de otro docente responde 404.
 *
 *   GET    /api/classrooms?status=active|archived|all&schoolYear=<año>
 *   POST   /api/classrooms                 { name, gradeId, section, schoolYear, subjectIds? }
 *   GET    /api/classrooms/:id
 *   PATCH  /api/classrooms/:id             cualquiera de los anteriores y/o isActive
 *   DELETE /api/classrooms/:id             archivado lógico (no borra)
 *
 * Cada aula llega con `grade`, `subjects` y `activeStudentCount` ya resueltos.
 */

/** Campos que el backend acepta al crear o editar un aula. */
export const CLASSROOM_FIELDS = Object.freeze(['name', 'gradeId', 'section', 'schoolYear', 'subjectIds'])

const pickClassroomFields = (data) =>
    Object.fromEntries(CLASSROOM_FIELDS.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]))

export const listClassrooms = async ({ status = 'active', schoolYear } = {}) => {
    const params = { status }
    if (schoolYear) params.schoolYear = schoolYear
    const { data } = await apiClient.get('/classrooms', { params })
    return data.data.classrooms
}

export const getClassroom = async (id) => {
    const { data } = await apiClient.get(`/classrooms/${encodeURIComponent(id)}`)
    return data.data.classroom
}

export const createClassroom = async (fields) => {
    const { data } = await apiClient.post('/classrooms', pickClassroomFields(fields))
    return data.data.classroom
}

/** Solo envía los campos indicados (los que cambiaron). */
export const updateClassroom = async (id, changes) => {
    const body = pickClassroomFields(changes)
    if (typeof changes.isActive === 'boolean') body.isActive = changes.isActive
    const { data } = await apiClient.patch(`/classrooms/${encodeURIComponent(id)}`, body)
    return data.data.classroom
}

/** Archiva el aula. Los estudiantes y su historial se conservan. */
export const archiveClassroom = async (id) => {
    const { data } = await apiClient.delete(`/classrooms/${encodeURIComponent(id)}`)
    return data.data.classroom
}

/** Restaura un aula archivada. */
export const restoreClassroom = (id) => updateClassroom(id, { isActive: true })
