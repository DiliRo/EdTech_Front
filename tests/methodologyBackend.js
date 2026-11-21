import { mockApi, fakeToken, TEACHER, ok, fail, healthy } from './mockApi.js'
import { tokenStorage } from '../src/utils/tokenStorage.js'

/**
 * Backend B5 simulado con las reglas del real: predeterminadas visibles para todos y de solo lectura
 * (403), personalizadas solo del docente, filtros por grado/materia (lista vacía = aplicable a todos),
 * maxDuration sobre la duración mínima y preferencias con coincidencia parcial.
 * Los textos son datos de prueba de los tests, no contenido pedagógico.
 */
export const PREFERENCES = [
    { code: 'visual', label: 'Visual' },
    { code: 'auditiva', label: 'Auditiva y oral' },
    { code: 'kinestesica', label: 'Kinestésica y manipulativa' },
    { code: 'lectoescritura', label: 'Lectura y escritura' },
    { code: 'colaborativa', label: 'Colaborativa' },
    { code: 'individual', label: 'Individual y reflexiva' }
]
export const G1 = { id: '64b000000000000000000001', number: 1, name: 'Primer grado', level: 'primaria' }
export const G2 = { id: '64b000000000000000000002', number: 2, name: 'Segundo grado', level: 'primaria' }
export const S1 = { id: '64c000000000000000000001', code: 'a', name: 'Materia A', grades: [G1, G2], isSample: false }
export const S2 = { id: '64c000000000000000000002', code: 'b', name: 'Materia B', grades: [G1], isSample: false }

let seq = 100
const newId = () => `64a${String(++seq).padStart(21, '0')}`

export const defaultMethod = (overrides = {}) => ({
    id: newId(),
    name: 'Estrategia predeterminada',
    description: 'Descripción de prueba de una estrategia predeterminada.',
    objectives: ['Objetivo de prueba uno', 'Objetivo de prueba dos'],
    steps: [{ title: 'Inicio', description: 'Paso uno de prueba' }, { description: 'Paso dos sin título' }],
    suggestedActivities: [{ title: 'Actividad de prueba', description: 'Detalle de la actividad' }],
    materials: [],
    estimatedDuration: null,
    compatibleGrades: [],
    compatibleSubjects: [],
    learningPreferences: ['auditiva', 'colaborativa'],
    isDefault: true,
    defaultKey: 'estrategia-prueba',
    createdBy: null,
    sourceReference: { title: 'Documento de prueba', institution: 'Institución de prueba', year: 2010, section: '1.4', pages: '16', url: 'https://example.org/doc.pdf', notes: 'Notas de la fuente' },
    isActive: true,
    ...overrides
})

export const customMethod = (overrides = {}) => ({
    ...defaultMethod(),
    id: newId(),
    name: 'Mi estrategia',
    description: 'Una estrategia propia de prueba.',
    isDefault: false,
    defaultKey: undefined,
    createdBy: 'teacher-1',
    materials: ['Tarjetas', 'Pizarrón', 'Marcadores', 'Hojas'],
    estimatedDuration: { minMinutes: 30, maxMinutes: 45 },
    sourceReference: null,
    ...overrides
})

const populate = (m) => ({
    ...m,
    compatibleGrades: m.compatibleGrades.map((id) => [G1, G2].find((g) => g.id === id) ?? id),
    compatibleSubjects: m.compatibleSubjects.map((id) => [S1, S2].find((s) => s.id === id) ?? id)
})

export const createMethodologyBackend = ({ methods = [], overrides = {} } = {}) => {
    // Se guardan con ids en las listas de compatibilidad, como en MongoDB
    const db = methods.map((m) => ({
        ...m,
        compatibleGrades: m.compatibleGrades.map((g) => g.id ?? g),
        compatibleSubjects: m.compatibleSubjects.map((s) => s.id ?? s)
    }))
    const find = (id) => db.find((m) => m.id === id && (m.isDefault || m.createdBy === 'teacher-1'))

    tokenStorage.set(fakeToken())
    const calls = mockApi({
        'GET /auth/me': () => ok({ teacher: TEACHER }),
        'GET /health': healthy,
        'GET /classrooms': () => ok({ classrooms: [] }),
        'GET /grades': () => ok({ grades: [G1, G2] }),
        'GET /subjects': ({ params }) => ({
            status: 200,
            body: { success: true, data: { subjects: [S1, S2].filter((s) => !params.grade || s.grades.some((g) => g.id === params.grade)) }, meta: { containsSampleData: false } }
        }),
        'GET /methodologies': ({ params }) => {
            const prefs = params.learningPreferences ? params.learningPreferences.split(',') : []
            const list = db
                .filter((m) => m.isActive)
                .filter((m) => (params.scope === 'default' ? m.isDefault : params.scope === 'mine' ? m.createdBy === 'teacher-1' : true))
                .filter((m) => !params.grade || !m.compatibleGrades.length || m.compatibleGrades.includes(params.grade))
                .filter((m) => !params.subject || !m.compatibleSubjects.length || m.compatibleSubjects.includes(params.subject))
                .filter((m) => !params.maxDuration || (m.estimatedDuration && m.estimatedDuration.minMinutes <= params.maxDuration))
                .filter((m) => !prefs.length || m.learningPreferences.some((p) => prefs.includes(p)))
                .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name))
            return { status: 200, body: { success: true, data: { methodologies: list.map(populate) }, meta: { learningPreferences: PREFERENCES } } }
        },
        'GET /methodologies/:id': ({ pathParams }) => {
            const m = find(pathParams.id)
            return m ? ok({ methodology: populate(m) }) : fail(404, 'Metodología no encontrada')
        },
        'POST /methodologies': ({ body }) => {
            const m = { ...customMethod(), sourceReference: null, objectives: [], steps: [], suggestedActivities: [], materials: [], estimatedDuration: null, compatibleGrades: [], compatibleSubjects: [], learningPreferences: [], ...body }
            db.push(m)
            return { status: 201, body: { success: true, data: { methodology: populate(m) } } }
        },
        'PATCH /methodologies/:id': ({ pathParams, body }) => {
            const m = find(pathParams.id)
            if (!m) return fail(404, 'Metodología no encontrada')
            if (m.isDefault) return fail(403, 'Las metodologías predeterminadas no se pueden modificar. Puedes crear una propia basada en ella.')
            Object.assign(m, body)
            return ok({ methodology: populate(m) })
        },
        'DELETE /methodologies/:id': ({ pathParams }) => {
            const m = find(pathParams.id)
            if (!m) return fail(404, 'Metodología no encontrada')
            if (m.isDefault) return fail(403, 'Las metodologías predeterminadas no se pueden modificar.')
            m.isActive = false
            return ok({ methodology: populate(m) })
        },
        ...overrides
    })
    return { db, calls }
}
