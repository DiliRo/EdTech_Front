import { apiClient } from './apiClient.js'

/**
 * Estudiantes de un aula (módulo B4). Los estudiantes NO son usuarios: no tienen cuenta, sesión
 * ni datos personales. Se identifican solo con el código que asigna el docente (`studentCode`).
 *
 *   GET    /api/classrooms/:id/students?status=active|archived|all
 *   POST   /api/classrooms/:id/students   { studentCode }
 *   PATCH  /api/students/:id              { studentCode?, isActive? }
 *   DELETE /api/students/:id              retiro (archivado lógico; el historial se conserva)
 *
 * Este servicio solo envía `studentCode` e `isActive`: ningún otro dato sale del navegador.
 */

export const listStudents = async (classroomId, { status = 'active' } = {}) => {
    const { data } = await apiClient.get(`/classrooms/${encodeURIComponent(classroomId)}/students`, { params: { status } })
    return data.data.students
}

export const addStudent = async (classroomId, { studentCode }) => {
    const { data } = await apiClient.post(`/classrooms/${encodeURIComponent(classroomId)}/students`, {
        studentCode: String(studentCode).trim()
    })
    return data.data.student
}

export const updateStudentCode = async (studentId, studentCode) => {
    const { data } = await apiClient.patch(`/students/${encodeURIComponent(studentId)}`, { studentCode: String(studentCode).trim() })
    return data.data.student
}

/** Retira al estudiante del aula (archivado lógico). */
export const withdrawStudent = async (studentId) => {
    const { data } = await apiClient.delete(`/students/${encodeURIComponent(studentId)}`)
    return data.data.student
}

/** Reincorpora a un estudiante retirado. */
export const reinstateStudent = async (studentId) => {
    const { data } = await apiClient.patch(`/students/${encodeURIComponent(studentId)}`, { isActive: true })
    return data.data.student
}
