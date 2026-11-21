import { mockApi, fakeToken, TEACHER, ok, fail, healthy } from './mockApi.js'
import { tokenStorage } from '../src/utils/tokenStorage.js'

/**
 * Backend B6 simulado con las reglas del real (src/services/assessment.service.js y
 * progress.service.js): calificaciones por studentId, faltantes que NO cuentan como cero,
 * correcciones que guardan el valor anterior, nota máxima validada y estadísticas solo sobre
 * calificaciones registradas. Datos de prueba de los tests.
 */
export const NOTE = 'Indicadores de apoyo para el docente. Un resultado bajo no es un diagnóstico del estudiante; las evaluaciones sin calificación registrada no cuentan como cero.'
export const G1 = { id: '64b000000000000000000001', number: 1, name: 'Primer grado', level: 'primaria' }
export const SUB = { id: '64c000000000000000000001', code: 'a', name: 'Materia A', isSample: false }
export const SUB2 = { id: '64c000000000000000000002', code: 'b', name: 'Materia B', isSample: false }
export const TOPIC = { id: '64d000000000000000000001', code: 't', name: 'Tema uno', grade: G1, subject: SUB }
export const METHOD = { id: '64a000000000000000000001', name: 'Estrategia X', isDefault: true, isActive: true, learningPreferences: [], materials: [], compatibleGrades: [], compatibleSubjects: [] }

const round = (v) => (v === null || v === undefined ? null : Math.round((v + Number.EPSILON) * 100) / 100)
const mean = (xs) => (xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)
const median = (xs) => {
    if (!xs.length) return null
    const s = [...xs].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2)
}
const summarize = (xs) => ({ count: xs.length, average: mean(xs), median: median(xs), min: xs.length ? Math.min(...xs) : null, max: xs.length ? Math.max(...xs) : null })
const trend = (xs) => {
    if (xs.length < 2) return { change: null, direction: null }
    const change = round(xs[xs.length - 1] - xs[0])
    return { change, direction: change >= 5 ? 'up' : change <= -5 ? 'down' : 'stable' }
}
const below = (v, t) => typeof v === 'number' && v < t

let seq = 0
const id = (p) => `${p}${String(++seq).padStart(24 - p.length, '0')}`

export const CLASSROOM = { id: '64e000000000000000000001', name: 'Primero A', gradeId: G1.id, grade: G1, section: 'A', schoolYear: 2026, subjectIds: [SUB.id, SUB2.id], subjects: [SUB, SUB2], isActive: true }

export const createAssessmentBackend = ({ students = ['A01', 'A02', 'A03'], assessments = [], results = [], overrides = {} } = {}) => {
    const db = {
        students: students.map((s) => (typeof s === 'string' ? { id: id('64f'), studentCode: s, classroomId: CLASSROOM.id, isActive: true } : s)),
        assessments: assessments.map((a) => ({ id: id('650'), classroomId: CLASSROOM.id, subjectId: SUB.id, topicId: null, teachingMethodId: null, assessmentType: 'formativa', ...a })),
        results: []
    }
    const studentByCode = (code) => db.students.find((s) => s.studentCode === code)
    for (const r of results) {
        const a = db.assessments[r.assessment]
        db.results.push({ id: id('651'), assessmentId: a.id, studentId: studentByCode(r.code).id, score: r.score, percentage: round((r.score / a.maxScore) * 100), observations: r.observations ?? '', corrections: [], updatedAt: '2026-03-01T00:00:00Z' })
    }

    const present = (r) => {
        const s = db.students.find((x) => x.id === r.studentId)
        return { ...r, studentCode: s?.studentCode ?? null, studentIsActive: s?.isActive ?? null }
    }
    const populate = (a) => ({
        ...a,
        subject: [SUB, SUB2].find((s) => s.id === a.subjectId) ?? null,
        topic: a.topicId === TOPIC.id ? TOPIC : null,
        teachingMethod: a.teachingMethodId === METHOD.id ? METHOD : null,
        classroom: { id: CLASSROOM.id, name: CLASSROOM.name }
    })
    const byDate = (a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate) || a.title.localeCompare(b.title)
    const describe = (a) => ({ id: a.id, title: a.title, assessmentDate: a.assessmentDate, assessmentType: a.assessmentType, subjectId: a.subjectId, maxScore: a.maxScore })
    const studentData = (studentId, params) => {
        const student = db.students.find((s) => s.id === studentId)
        if (!student) return null
        const list = db.assessments.filter((a) => a.classroomId === student.classroomId && (!params.subjectId || a.subjectId === params.subjectId)).sort(byDate)
        const resultOf = (a) => db.results.find((r) => r.assessmentId === a.id && r.studentId === student.id)
        return { student, list, resultOf }
    }
    const presentStudent = (s) => ({ id: s.id, studentCode: s.studentCode, classroomId: s.classroomId, isActive: s.isActive })

    tokenStorage.set(fakeToken())
    const calls = mockApi({
        'GET /auth/me': () => ok({ teacher: TEACHER }),
        'GET /health': healthy,
        'GET /classrooms': () => ok({ classrooms: [{ ...CLASSROOM, activeStudentCount: db.students.filter((s) => s.isActive).length }] }),
        'GET /classrooms/:id': ({ pathParams }) => (pathParams.id === CLASSROOM.id ? ok({ classroom: CLASSROOM }) : fail(404, 'Aula no encontrada')),
        'GET /topics': () => ({ status: 200, body: { success: true, data: { topics: [TOPIC] }, meta: { page: 1, limit: 100, total: 1, totalPages: 1, containsSampleData: false } } }),
        'GET /methodologies': () => ({ status: 200, body: { success: true, data: { methodologies: [METHOD] }, meta: { learningPreferences: [] } } }),
        'GET /assessments': ({ params }) =>
            ok({
                assessments: db.assessments
                    .filter((a) => (!params.classroomId || a.classroomId === params.classroomId) && (!params.subjectId || a.subjectId === params.subjectId) && (!params.assessmentType || a.assessmentType === params.assessmentType))
                    .sort((a, b) => -byDate(a, b))
                    .map(populate)
            }),
        'POST /assessments': ({ body }) => {
            const a = { id: id('650'), topicId: null, teachingMethodId: null, ...body, assessmentDate: `${body.assessmentDate}T00:00:00.000Z` }
            db.assessments.push(a)
            return { status: 201, body: { success: true, data: { assessment: populate(a) } } }
        },
        'GET /assessments/:id': ({ pathParams }) => {
            const a = db.assessments.find((x) => x.id === pathParams.id)
            if (!a) return fail(404, 'Evaluación no encontrada')
            const own = db.results.filter((r) => r.assessmentId === a.id)
            const graded = new Set(own.map((r) => r.studentId))
            const active = db.students.filter((s) => s.isActive)
            const pendingStudents = active.filter((s) => !graded.has(s.id)).map((s) => ({ studentId: s.id, studentCode: s.studentCode }))
            const stats = summarize(own.map((r) => r.percentage))
            return {
                status: 200,
                body: {
                    success: true,
                    data: {
                        assessment: populate(a),
                        results: own.map(present),
                        pendingStudents,
                        summary: { ...stats, pendingCount: pendingStudents.length, completionRate: active.length ? round((own.length / active.length) * 100) : null }
                    },
                    meta: { note: NOTE }
                }
            }
        },
        'POST /assessments/:id/results': ({ pathParams, body }) => {
            const a = db.assessments.find((x) => x.id === pathParams.id)
            if (!a) return fail(404, 'Evaluación no encontrada')
            const errors = []
            body.results.forEach((e, i) => {
                for (const key of Object.keys(e)) if (!['studentId', 'score', 'observations', 'correctionReason'].includes(key)) errors.push({ field: `results[${i}].${key}`, message: 'Campo no permitido' })
                if (e.score > a.maxScore) errors.push({ field: `results[${i}].score`, message: `La nota no puede superar ${a.maxScore}` })
            })
            if (errors.length) return fail(400, 'Errores de validación', errors)
            const summary = { created: 0, updated: 0, unchanged: 0 }
            const saved = []
            for (const e of body.results) {
                const current = db.results.find((r) => r.assessmentId === a.id && r.studentId === e.studentId)
                const percentage = round((e.score / a.maxScore) * 100)
                if (!current) {
                    const r = { id: id('651'), assessmentId: a.id, studentId: e.studentId, score: e.score, percentage, observations: e.observations ?? '', corrections: [], updatedAt: `t${seq}` }
                    db.results.push(r)
                    summary.created += 1
                    saved.push(r)
                } else if (current.score === e.score && current.observations === (e.observations ?? current.observations)) {
                    summary.unchanged += 1
                    saved.push(current)
                } else {
                    current.corrections.push({ previousScore: current.score, previousPercentage: current.percentage, previousObservations: current.observations, changedAt: '2026-03-05T15:00:00Z', changedBy: 'teacher-1', reason: e.correctionReason ?? '' })
                    Object.assign(current, { score: e.score, percentage, observations: e.observations ?? current.observations, updatedAt: `t${++seq}` })
                    summary.updated += 1
                    saved.push(current)
                }
            }
            return ok({ summary, results: saved.map(present) })
        },
        'GET /classrooms/:id/performance': ({ pathParams, params }) => {
            if (pathParams.id !== CLASSROOM.id) return fail(404, 'Aula no encontrada')
            const threshold = params.threshold ?? 60
            const list = db.assessments.filter((a) => !params.subjectId || a.subjectId === params.subjectId).sort(byDate)
            const res = db.results.filter((r) => list.some((a) => a.id === r.assessmentId))
            const activeIds = db.students.filter((s) => s.isActive).map((s) => s.id)
            const perAssessment = list.map((a) => {
                const own = res.filter((r) => r.assessmentId === a.id)
                const st = summarize(own.map((r) => r.percentage))
                return { ...describe(a), resultsCount: st.count, pendingCount: activeIds.filter((sid) => !own.some((r) => r.studentId === sid)).length, averagePercentage: st.average, medianPercentage: st.median, minPercentage: st.min, maxPercentage: st.max, belowThresholdCount: own.filter((r) => below(r.percentage, threshold)).length }
            })
            const order = new Map(list.map((a, i) => [a.id, i]))
            const perStudent = db.students
                .filter((s) => s.isActive || res.some((r) => r.studentId === s.id))
                .sort((a, b) => a.studentCode.localeCompare(b.studentCode))
                .map((s) => {
                    const values = res.filter((r) => r.studentId === s.id).sort((x, y) => order.get(x.assessmentId) - order.get(y.assessmentId)).map((r) => r.percentage)
                    const average = mean(values)
                    return { studentId: s.id, studentCode: s.studentCode, isActive: s.isActive, resultsCount: values.length, assessmentsWithoutResult: list.length - values.length, averagePercentage: average, trend: trend(values), belowThreshold: below(average, threshold) }
                })
            const overall = summarize(res.map((r) => r.percentage))
            return {
                status: 200,
                body: {
                    success: true,
                    data: {
                        classroom: { id: CLASSROOM.id, name: CLASSROOM.name, isActive: true },
                        threshold,
                        summary: { assessmentsCount: list.length, studentsCount: activeIds.length, resultsCount: overall.count, completionRate: list.length && activeIds.length ? round((res.length / (list.length * activeIds.length)) * 100) : null, averagePercentage: overall.average, medianPercentage: overall.median, minPercentage: overall.min, maxPercentage: overall.max, averageOfStudentAverages: mean(perStudent.map((p) => p.averagePercentage).filter((v) => v !== null)) },
                        belowThreshold: { threshold, resultsCount: res.filter((r) => below(r.percentage, threshold)).length, students: perStudent.filter((p) => p.belowThreshold) },
                        perAssessment,
                        perStudent
                    },
                    meta: { note: NOTE }
                }
            }
        },
        'GET /students/:id/results': ({ pathParams, params }) => {
            const d = studentData(pathParams.id, params)
            if (!d) return fail(404, 'Estudiante no encontrado')
            const history = d.list.filter((a) => d.resultOf(a)).map((a) => ({ assessment: describe(a), result: present(d.resultOf(a)) }))
            return ok({ student: presentStudent(d.student), results: history, assessmentsWithoutResult: d.list.length - history.length })
        },
        'GET /students/:id/progress': ({ pathParams, params }) => {
            const d = studentData(pathParams.id, params)
            if (!d) return fail(404, 'Estudiante no encontrado')
            const threshold = params.threshold ?? 60
            const evolution = d.list.filter((a) => d.resultOf(a)).map((a) => {
                const { id: assessmentId, ...info } = describe(a)
                return { assessmentId, ...info, score: d.resultOf(a).score, percentage: d.resultOf(a).percentage }
            })
            const pct = evolution.map((e) => e.percentage)
            const st = summarize(pct)
            const subjectIds = [...new Set(d.list.map((a) => a.subjectId))]
            return {
                status: 200,
                body: {
                    success: true,
                    data: {
                        student: presentStudent(d.student),
                        threshold,
                        summary: { resultsCount: st.count, assessmentsWithoutResult: d.list.length - st.count, averagePercentage: st.average, medianPercentage: st.median, minPercentage: st.min, maxPercentage: st.max, latestPercentage: pct.length ? pct[pct.length - 1] : null, belowThreshold: below(st.average, threshold) },
                        trend: trend(pct),
                        evolution,
                        bySubject: subjectIds.map((sid) => {
                            const values = evolution.filter((e) => e.subjectId === sid).map((e) => e.percentage)
                            return { subjectId: sid, subjectName: [SUB, SUB2].find((s) => s.id === sid)?.name ?? null, resultsCount: values.length, assessmentsWithoutResult: d.list.filter((a) => a.subjectId === sid).length - values.length, averagePercentage: mean(values), trend: trend(values) }
                        })
                    },
                    meta: { note: NOTE }
                }
            }
        },
        ...overrides
    })
    return { db, calls, studentByCode }
}
