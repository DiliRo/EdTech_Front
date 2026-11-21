/**
 * Reglas de aulas y estudiantes, iguales a las del backend (src/config/classroom.js), para
 * validar antes de enviar. El backend vuelve a validar todo.
 */
export const CLASSROOM_NAME_MAX = 80
export const SECTION_MAX = 10
export const SCHOOL_YEAR_RANGE = Object.freeze({ min: 2000, max: 2100 })
export const MAX_SUBJECTS_PER_CLASSROOM = 20
export const STUDENT_CODE_MAX = 20
export const STUDENT_CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{0,19}$/
const SECTION_REGEX = /^[\p{L}0-9 -]+$/u

/** Filtros de estado que acepta el backend. */
export const STATUS_OPTIONS = Object.freeze({
    classrooms: [
        { value: 'active', label: 'Activas' },
        { value: 'archived', label: 'Archivadas' },
        { value: 'all', label: 'Todas' }
    ],
    students: [
        { value: 'active', label: 'Activos' },
        { value: 'archived', label: 'Retirados' },
        { value: 'all', label: 'Todos' }
    ]
})

export const PAGE_SIZES = Object.freeze({ classrooms: 9, students: 20 })

export const currentSchoolYear = () => new Date().getFullYear()

/** Código como lo guarda el backend: sin espacios a los lados y en mayúsculas. */
export const normalizeStudentCode = (value) => String(value ?? '').trim().toUpperCase()

export const validateClassroomName = (value) => {
    const name = String(value ?? '').trim()
    if (!name) return 'El nombre del aula es obligatorio'
    if (name.length > CLASSROOM_NAME_MAX) return `Máximo ${CLASSROOM_NAME_MAX} caracteres`
    return null
}

export const validateSection = (value) => {
    const section = String(value ?? '').trim()
    if (!section) return 'La sección es obligatoria'
    if (section.length > SECTION_MAX) return `Máximo ${SECTION_MAX} caracteres`
    if (!SECTION_REGEX.test(section)) return 'La sección solo puede tener letras, números, espacios o guiones'
    return null
}

export const validateSchoolYear = (value) => {
    const text = String(value ?? '').trim()
    const year = Number(text)
    if (!text || !Number.isInteger(year) || year < SCHOOL_YEAR_RANGE.min || year > SCHOOL_YEAR_RANGE.max) {
        return `El ciclo escolar debe ser un año entre ${SCHOOL_YEAR_RANGE.min} y ${SCHOOL_YEAR_RANGE.max}`
    }
    return null
}

export const validateGradeId = (value) => (value ? null : 'Selecciona un grado')

export const validateSubjectIds = (ids) =>
    ids.length > MAX_SUBJECTS_PER_CLASSROOM ? `Selecciona como máximo ${MAX_SUBJECTS_PER_CLASSROOM} materias` : null

export const validateStudentCode = (value) => {
    const code = normalizeStudentCode(value)
    if (!code) return 'El código del estudiante es obligatorio'
    if (code.length > STUDENT_CODE_MAX) return `El código no puede superar ${STUDENT_CODE_MAX} caracteres`
    if (!STUDENT_CODE_REGEX.test(code)) return 'Usa letras sin tilde, números, guion o guion bajo, sin espacios (p. ej. A01, MAT-03)'
    return null
}

/** "Primer grado · Sección A" */
export const classroomGradeLabel = (classroom) =>
    [classroom?.grade?.name, classroom?.section ? `Sección ${classroom.section}` : null].filter(Boolean).join(' · ')

export const formatDate = (value) =>
    value ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium' }).format(new Date(value)) : ''
