/**
 * Reglas de metodologías, iguales a las del backend (src/config/methodology.js). El backend vuelve
 * a validar todo; aquí solo se evita enviar datos que serán rechazados.
 */
export const METHOD_LIMITS = Object.freeze({ name: 120, description: 3000, item: 1000, title: 150, listMax: 30, referenceText: 300, notes: 1500 })
export const DURATION_RANGE = Object.freeze({ min: 5, max: 600 })
export const MIN_PREFERENCES_WHEN_SET = 2

/** Opciones del filtro "tiempo disponible" (minutos). */
export const DURATION_FILTER_OPTIONS = Object.freeze([30, 45, 60, 90, 120])

export const SCOPE_OPTIONS = Object.freeze([
    { value: 'all', label: 'Todas' },
    { value: 'default', label: 'Predeterminadas' },
    { value: 'mine', label: 'Mis metodologías' }
])

/** Parámetros de la URL del listado (los filtros se conservan al volver del detalle). */
export const METHOD_FILTER_PARAMS = Object.freeze({
    scope: 'tipo',
    grade: 'grado',
    subject: 'materia',
    maxDuration: 'duracion',
    learningPreferences: 'preferencias'
})

export const formatDuration = (duration) => {
    if (!duration?.minMinutes) return null
    const { minMinutes, maxMinutes } = duration
    return minMinutes === maxMinutes || !maxMinutes ? `${minMinutes} min` : `${minMinutes}–${maxMinutes} min`
}

/** "Visual, Colaborativa" a partir de los códigos y el catálogo del backend. */
export const preferenceLabel = (code, catalog = []) => catalog.find((item) => item.code === code)?.label ?? code

const idsOf = (list = []) => list.map((item) => (typeof item === 'string' ? item : item?.id)).filter(Boolean)

const EMPTY_SOURCE = { title: '', institution: '', year: '', section: '', pages: '', url: '', notes: '' }

/** Valores del formulario a partir de una metodología del backend (o vacíos). */
export const toMethodologyFormValues = (method) => ({
    name: method?.name ?? '',
    description: method?.description ?? '',
    objectives: [...(method?.objectives ?? [])],
    steps: (method?.steps ?? []).map((step) => ({ title: step.title ?? '', description: step.description ?? '' })),
    suggestedActivities: (method?.suggestedActivities ?? []).map((a) => ({ title: a.title ?? '', description: a.description ?? '' })),
    materials: [...(method?.materials ?? [])],
    estimatedDuration: {
        min: method?.estimatedDuration?.minMinutes ? String(method.estimatedDuration.minMinutes) : '',
        max: method?.estimatedDuration?.maxMinutes ? String(method.estimatedDuration.maxMinutes) : ''
    },
    compatibleGrades: idsOf(method?.compatibleGrades),
    compatibleSubjects: idsOf(method?.compatibleSubjects),
    learningPreferences: [...(method?.learningPreferences ?? [])],
    sourceReference: Object.fromEntries(
        Object.keys(EMPTY_SOURCE).map((key) => [key, method?.sourceReference?.[key] != null ? String(method.sourceReference[key]) : ''])
    )
})

const clean = (value) => String(value ?? '').trim()
const cleanList = (list) => list.map(clean).filter(Boolean)

/** Cuerpo para POST/PATCH con los nombres del contrato B5. Elementos vacíos de las listas se omiten. */
export const toMethodologyPayload = (values) => {
    const min = clean(values.estimatedDuration.min)
    const max = clean(values.estimatedDuration.max)
    const sourceEntries = Object.entries(values.sourceReference)
        .map(([key, value]) => [key, clean(value)])
        .filter(([, value]) => value !== '')
        .map(([key, value]) => [key, key === 'year' ? Number(value) : value])

    return {
        name: clean(values.name),
        description: clean(values.description),
        objectives: cleanList(values.objectives),
        steps: values.steps
            .map((step) => ({ title: clean(step.title), description: clean(step.description) }))
            .filter((step) => step.title || step.description)
            .map((step) => (step.title ? step : { description: step.description })),
        suggestedActivities: values.suggestedActivities
            .map((a) => ({ title: clean(a.title), description: clean(a.description) }))
            .filter((a) => a.title || a.description)
            .map((a) => (a.description ? a : { title: a.title })),
        materials: cleanList(values.materials),
        // Una sola duración indicada se toma como mínima y máxima
        estimatedDuration: min || max ? { minMinutes: Number(min || max), maxMinutes: Number(max || min) } : null,
        compatibleGrades: [...values.compatibleGrades],
        compatibleSubjects: [...values.compatibleSubjects],
        learningPreferences: [...values.learningPreferences],
        sourceReference: sourceEntries.length ? Object.fromEntries(sourceEntries) : null
    }
}

/** Solo los campos que cambiaron (para PATCH). */
export const diffMethodology = (original, payload) =>
    Object.fromEntries(Object.entries(payload).filter(([field, value]) => JSON.stringify(value) !== JSON.stringify(original[field])))

const tooLong = (value, max) => clean(value).length > max

/** Validación previa al envío. Devuelve { campo: mensaje|null } para useFormState.validate. */
export const validateMethodology = (values) => {
    const L = METHOD_LIMITS
    const errors = {}

    const name = clean(values.name)
    errors.name = !name ? 'El nombre es obligatorio' : name.length > L.name ? `Máximo ${L.name} caracteres` : null
    const description = clean(values.description)
    errors.description = !description ? 'La descripción es obligatoria' : description.length > L.description ? `Máximo ${L.description} caracteres` : null

    const listError = (items, label) => (items.length > L.listMax ? `Máximo ${L.listMax} ${label}` : null)

    errors.objectives = listError(cleanList(values.objectives), 'objetivos') ?? (values.objectives.some((o) => tooLong(o, L.item)) ? `Cada objetivo: máximo ${L.item} caracteres` : null)

    const stepIndex = values.steps.findIndex((s) => clean(s.title) && !clean(s.description))
    errors.steps =
        listError(values.steps.filter((s) => clean(s.title) || clean(s.description)), 'pasos') ??
        (stepIndex >= 0
            ? `Paso ${stepIndex + 1}: la descripción es obligatoria`
            : values.steps.some((s) => tooLong(s.title, L.title) || tooLong(s.description, L.item))
              ? `Título: máximo ${L.title} caracteres; descripción: máximo ${L.item}`
              : null)

    const activityIndex = values.suggestedActivities.findIndex((a) => clean(a.description) && !clean(a.title))
    errors.suggestedActivities =
        listError(values.suggestedActivities.filter((a) => clean(a.title) || clean(a.description)), 'actividades') ??
        (activityIndex >= 0
            ? `Actividad ${activityIndex + 1}: el título es obligatorio`
            : values.suggestedActivities.some((a) => tooLong(a.title, L.title) || tooLong(a.description, L.item))
              ? `Título: máximo ${L.title} caracteres; descripción: máximo ${L.item}`
              : null)

    errors.materials = listError(cleanList(values.materials), 'materiales') ?? (values.materials.some((m) => tooLong(m, L.title)) ? `Cada material: máximo ${L.title} caracteres` : null)

    const { min, max } = values.estimatedDuration
    const inRange = (v) => clean(v) === '' || (Number.isInteger(Number(v)) && Number(v) >= DURATION_RANGE.min && Number(v) <= DURATION_RANGE.max)
    errors.estimatedDuration = !inRange(min) || !inRange(max)
        ? `La duración debe estar entre ${DURATION_RANGE.min} y ${DURATION_RANGE.max} minutos`
        : clean(min) && clean(max) && Number(min) > Number(max)
          ? 'La duración mínima no puede ser mayor que la máxima'
          : null

    const prefs = values.learningPreferences.length
    errors.learningPreferences =
        prefs > 0 && prefs < MIN_PREFERENCES_WHEN_SET ? 'Indica al menos dos preferencias o ninguna: una metodología no es exclusiva de un estilo de aprendizaje' : null

    const source = values.sourceReference
    const year = clean(source.year)
    const url = clean(source.url)
    errors.sourceReference =
        year && !(Number.isInteger(Number(year)) && Number(year) >= 1900 && Number(year) <= 2100)
            ? 'El año de la fuente no es válido'
            : url && !/^https?:\/\/\S+\.\S+/.test(url)
              ? 'La URL de la fuente debe empezar con http:// o https://'
              : tooLong(source.notes, L.notes)
                ? `Notas: máximo ${L.notes} caracteres`
                : ['title', 'institution', 'section'].some((key) => tooLong(source[key], L.referenceText))
                  ? `Cada dato de la fuente: máximo ${L.referenceText} caracteres`
                  : null

    return errors
}

/** Valores para crear una metodología propia a partir de una predeterminada, citando el origen. */
export const adaptFromDefault = (method) => {
    const values = toMethodologyFormValues(method)
    values.name = `${method.name} (mi adaptación)`.slice(0, METHOD_LIMITS.name)
    values.sourceReference.notes = `Adaptación personal de la metodología predeterminada «${method.name}».`.slice(0, METHOD_LIMITS.notes)
    return values
}
