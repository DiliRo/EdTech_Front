/**
 * Reglas de evaluaciones para la interfaz. Las de validación son iguales a las del backend
 * (src/config/assessment.js); las de "datos suficientes" son de presentación.
 */
export const ASSESSMENT_TYPES = Object.freeze([
    { value: 'diagnostica', label: 'Diagnóstica' },
    { value: 'formativa', label: 'Formativa' },
    { value: 'sumativa', label: 'Sumativa' }
])
export const MAX_SCORE_LIMIT = 1000
export const TITLE_MAX = 150
export const OBSERVATIONS_MAX = 500
export const CORRECTION_REASON_MAX = 300

/**
 * Mínimo de calificaciones registradas para mostrar estadísticas (promedio, mediana, mínimo,
 * máximo) de un aula o de una evaluación. Con menos, la interfaz dice que los datos son insuficientes.
 */
export const MIN_RESULTS_FOR_GROUP_STATS = 3
/** Mínimo de calificaciones de UN estudiante para mostrar su promedio, tendencia o indicador. */
export const MIN_RESULTS_FOR_STUDENT_STATS = 2
/** Puntos mínimos para dibujar una evolución. */
export const MIN_POINTS_FOR_CHART = 2

export const THRESHOLD_RANGE = Object.freeze({ min: 0, max: 100 })

export const assessmentTypeLabel = (value) => ASSESSMENT_TYPES.find((t) => t.value === value)?.label ?? value

/** Hoy en formato AAAA-MM-DD (fecha local del docente). */
export const todayISO = () => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * El backend guarda la fecha de la evaluación a medianoche UTC. Se formatea en UTC para que en
 * Guatemala (UTC−6) no aparezca el día anterior.
 */
export const formatAssessmentDate = (value, style = 'medium') =>
    value ? new Intl.DateTimeFormat('es-GT', { dateStyle: style, timeZone: 'UTC' }).format(new Date(value)) : ''

export const shortAssessmentDate = (value) =>
    value ? new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value)) : ''

const numberFormat = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 })
export const formatNumber = (value) => (value === null || value === undefined ? '—' : numberFormat.format(value))
export const formatPercent = (value) => (value === null || value === undefined ? '—' : `${numberFormat.format(value)} %`)

/** "15 / 20" — la escala siempre visible junto a la nota. */
export const formatScore = (score, maxScore) => `${formatNumber(score)} / ${formatNumber(maxScore)}`

/**
 * Convierte lo escrito en la celda de nota. Acepta coma o punto decimal.
 * @returns {{ empty: true } | { value: number } | { error: string }}
 */
export const parseScore = (text, maxScore) => {
    const raw = String(text ?? '').trim()
    if (raw === '') return { empty: true }
    const normalized = raw.replace(',', '.')
    if (!/^\d+(\.\d+)?$/.test(normalized)) return { error: 'Escribe un número (p. ej. 15 o 15.5)' }
    const value = Number(normalized)
    if (value > maxScore) return { error: `La nota no puede superar ${formatNumber(maxScore)}` }
    return { value }
}

export const percentageOf = (score, maxScore) => (maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : null)

export const validateMaxScore = (text) => {
    const raw = String(text ?? '').trim().replace(',', '.')
    const value = Number(raw)
    if (!raw || !Number.isFinite(value) || value <= 0 || value > MAX_SCORE_LIMIT) return `La puntuación máxima debe ser mayor que 0 y hasta ${MAX_SCORE_LIMIT}`
    return null
}

export const validateThreshold = (text) => {
    const raw = String(text ?? '').trim().replace(',', '.')
    const value = Number(raw)
    if (raw === '' || !Number.isFinite(value) || value < THRESHOLD_RANGE.min || value > THRESHOLD_RANGE.max) return 'El umbral debe estar entre 0 y 100'
    return null
}

const TREND_TEXT = { up: 'Subió', down: 'Bajó', stable: 'Estable' }

/** Texto de la tendencia (último − primero, en puntos porcentuales) o null si no hay datos suficientes. */
export const trendText = (trend) => {
    if (!trend?.direction) return null
    if (trend.direction === 'stable') return `Estable (${trend.change > 0 ? '+' : ''}${formatNumber(trend.change)} pts)`
    return `${TREND_TEXT[trend.direction]} ${formatNumber(Math.abs(trend.change))} pts`
}

/** El indicador de revisión solo se muestra con datos suficientes del estudiante. */
export const reviewStatus = ({ belowThreshold, resultsCount }) => {
    if (resultsCount < MIN_RESULTS_FOR_STUDENT_STATS) return 'insufficient'
    return belowThreshold ? 'review' : 'ok'
}

/**
 * Filas de la tabla: estudiantes con calificación + estudiantes activos sin calificación,
 * ordenados por código. Solo se identifican por su código.
 */
export const buildGradeRows = ({ results = [], pendingStudents = [] }) =>
    [
        ...results.map((r) => ({
            studentId: r.studentId,
            studentCode: r.studentCode ?? '—',
            isActive: r.studentIsActive !== false,
            existing: { score: r.score, percentage: r.percentage, observations: r.observations ?? '', corrections: r.corrections ?? [] }
        })),
        ...pendingStudents.map((p) => ({ studentId: p.studentId, studentCode: p.studentCode, isActive: true, existing: null }))
    ].sort((a, b) => a.studentCode.localeCompare(b.studentCode))
