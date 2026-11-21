import { mockApi, fakeToken, TEACHER, ok, fail, healthy } from './mockApi.js'
import { tokenStorage } from '../src/utils/tokenStorage.js'

/**
 * Backend B4 simulado en memoria, con las mismas reglas del real: solo aulas del docente (404 para
 * las demás), archivado lógico, códigos únicos por aula en MAYÚSCULAS (incluye retirados), no se
 * agregan estudiantes a un aula archivada y se rechazan datos personales.
 * Son datos de prueba de los tests, no contenido curricular.
 */
export const G1 = { id: '64b000000000000000000001', number: 1, name: 'Primer grado', level: 'primaria' }
export const G2 = { id: '64b000000000000000000002', number: 2, name: 'Segundo grado', level: 'primaria' }
export const S1 = { id: '64c000000000000000000001', code: 'a', name: 'Materia A', grades: [G1, G2], isSample: false }
export const S2 = { id: '64c000000000000000000002', code: 'b', name: 'Materia B', grades: [G1], isSample: false }
export const S3 = { id: '64c000000000000000000003', code: 'c', name: 'Materia C', grades: [G2], isSample: false }
const GRADES = [G1, G2]
const SUBJECTS = [S1, S2, S3]
const PERSONAL = ['name', 'firstName', 'lastName', 'email', 'password', 'phone']

let seq = 0
const newId = (prefix) => `${prefix}${String(++seq).padStart(24 - prefix.length, '0')}`

export const createBackend = ({ classrooms = [], students = [], overrides = {} } = {}) => {
    const db = { classrooms: classrooms.map((c) => ({ ...c })), students: students.map((s) => ({ ...s })) }

    const view = (c) => ({
        ...c,
        grade: GRADES.find((g) => g.id === c.gradeId) ?? null,
        subjects: SUBJECTS.filter((s) => c.subjectIds.includes(s.id)).map(({ id, code, name, isSample }) => ({ id, code, name, isSample })),
        activeStudentCount: db.students.filter((s) => s.classroomId === c.id && s.isActive).length
    })
    const byStatus = (status) => (item) => (status === 'archived' ? !item.isActive : status === 'all' ? true : item.isActive)
    const findClassroom = (id) => db.classrooms.find((c) => c.id === id)
    const notFound = () => fail(404, 'Aula no encontrada')
    const duplicate = (code) => fail(409, `Ya existe un estudiante con el código "${code}" en esta aula`, [
        { field: 'studentCode', message: 'El código ya está en uso en esta aula (también cuenta a los archivados)' }
    ])

    tokenStorage.set(fakeToken())
    const calls = mockApi({
        'GET /auth/me': () => ok({ teacher: TEACHER }),
        'GET /health': healthy,
        'GET /grades': () => ok({ grades: GRADES }),
        'GET /subjects': ({ params }) => ({
            status: 200,
            body: { success: true, data: { subjects: SUBJECTS.filter((s) => s.grades.some((g) => g.id === params.grade)) }, meta: { containsSampleData: false } }
        }),
        'GET /classrooms': ({ params }) =>
            ok({ classrooms: db.classrooms.filter(byStatus(params.status)).sort((a, b) => b.schoolYear - a.schoolYear || a.name.localeCompare(b.name)).map(view) }),
        'POST /classrooms': ({ body }) => {
            const c = { id: newId('64e'), ...body, subjectIds: body.subjectIds ?? [], section: body.section.toUpperCase(), isActive: true, createdAt: '2026-02-01T00:00:00Z' }
            db.classrooms.push(c)
            return { status: 201, body: { success: true, message: 'Aula creada', data: { classroom: view(c) } } }
        },
        'GET /classrooms/:id': ({ pathParams }) => {
            const c = findClassroom(pathParams.id)
            return c ? ok({ classroom: view(c) }) : notFound()
        },
        'PATCH /classrooms/:id': ({ pathParams, body }) => {
            const c = findClassroom(pathParams.id)
            if (!c) return notFound()
            if (!c.isActive && body.isActive !== true) return fail(409, 'El aula está archivada. Restáurala con "isActive": true para editarla.')
            Object.assign(c, body, body.section ? { section: body.section.toUpperCase() } : {})
            return ok({ classroom: view(c) })
        },
        'DELETE /classrooms/:id': ({ pathParams }) => {
            const c = findClassroom(pathParams.id)
            if (!c) return notFound()
            c.isActive = false
            return ok({ classroom: view(c) }, 'Aula archivada')
        },
        'GET /classrooms/:id/students': ({ pathParams, params }) => {
            if (!findClassroom(pathParams.id)) return notFound()
            const list = db.students.filter((s) => s.classroomId === pathParams.id).filter(byStatus(params.status))
            return ok({ students: list.sort((a, b) => a.studentCode.localeCompare(b.studentCode)) })
        },
        'POST /classrooms/:id/students': ({ pathParams, body }) => {
            const found = PERSONAL.filter((field) => field in body)
            if (found.length) return fail(400, 'Los estudiantes no son usuarios', found.map((field) => ({ field, message: 'Dato personal no permitido' })))
            const c = findClassroom(pathParams.id)
            if (!c) return notFound()
            if (!c.isActive) return fail(409, 'No se pueden agregar estudiantes a un aula archivada')
            const code = body.studentCode.trim().toUpperCase()
            if (db.students.some((s) => s.classroomId === c.id && s.studentCode === code)) return duplicate(code)
            const student = { id: newId('64f'), studentCode: code, classroomId: c.id, isActive: true, createdAt: '2026-02-02T00:00:00Z' }
            db.students.push(student)
            return { status: 201, body: { success: true, message: 'Estudiante registrado', data: { student } } }
        },
        'PATCH /students/:id': ({ pathParams, body }) => {
            const student = db.students.find((s) => s.id === pathParams.id)
            if (!student) return fail(404, 'Estudiante no encontrado')
            if (body.studentCode) {
                const code = body.studentCode.toUpperCase()
                if (db.students.some((s) => s.id !== student.id && s.classroomId === student.classroomId && s.studentCode === code)) return duplicate(code)
                student.studentCode = code
            }
            if (body.isActive !== undefined) student.isActive = body.isActive
            return ok({ student })
        },
        'DELETE /students/:id': ({ pathParams }) => {
            const student = db.students.find((s) => s.id === pathParams.id)
            if (!student) return fail(404, 'Estudiante no encontrado')
            student.isActive = false
            return ok({ student }, 'Estudiante archivado')
        },
        ...overrides
    })
    return { db, calls }
}

export const classroom = (overrides = {}) => ({
    id: newId('64e'),
    name: 'Aula de prueba',
    gradeId: G1.id,
    section: 'A',
    schoolYear: 2026,
    subjectIds: [S1.id],
    isActive: true,
    createdAt: '2026-01-15T00:00:00Z',
    ...overrides
})

export const student = (classroomId, studentCode, overrides = {}) => ({
    id: newId('64f'),
    studentCode,
    classroomId,
    isActive: true,
    createdAt: '2026-01-20T00:00:00Z',
    ...overrides
})
