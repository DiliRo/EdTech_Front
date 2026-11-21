import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './renderWithProviders.jsx'
import { fail } from './mockApi.js'
import { createAssessmentBackend, CLASSROOM, SUB, TOPIC, METHOD } from './assessmentBackend.js'
import { formatAssessmentDate, parseScore, reviewStatus, trendText, todayISO } from '../src/utils/assessment.js'

const u = () => userEvent.setup()
const lastCall = (calls, method, urlStart) => [...calls].reverse().find((c) => c.method === method && c.url.startsWith(urlStart))
const rowOf = (code) => screen.getByRole('link', { name: code }).closest('tr')

/** Tres evaluaciones en desorden: la vista debe ordenarlas por fecha. */
const threeAssessments = [
    { title: 'Prueba 2', assessmentDate: '2026-03-10T00:00:00.000Z', maxScore: 20 },
    { title: 'Prueba 1', assessmentDate: '2026-02-01T00:00:00.000Z', maxScore: 10 },
    { title: 'Prueba 3', assessmentDate: '2026-04-05T00:00:00.000Z', maxScore: 100 }
]

describe('Utilidades de evaluaciones', () => {
    it('interpreta la nota: vacío = sin calificación, coma decimal, cero válido y tope', () => {
        expect(parseScore('', 20)).toEqual({ empty: true })
        expect(parseScore('  ', 20)).toEqual({ empty: true })
        expect(parseScore('0', 20)).toEqual({ value: 0 })
        expect(parseScore('15,5', 20)).toEqual({ value: 15.5 })
        expect(parseScore('15.5', 20)).toEqual({ value: 15.5 })
        expect(parseScore('21', 20).error).toMatch(/no puede superar 20/)
        expect(parseScore('-1', 20).error).toMatch(/número/)
        expect(parseScore('abc', 20).error).toMatch(/número/)
    })

    it('muestra la fecha guardada en UTC sin correrla al día anterior', () => {
        const text = formatAssessmentDate('2026-03-01T00:00:00.000Z')
        expect(text).toMatch(/^0?1\D/) // día 1, no 28 de febrero
        expect(text).toMatch(/2026/)
    })

    it('solo indica revisión con datos suficientes del estudiante', () => {
        expect(reviewStatus({ belowThreshold: true, resultsCount: 1 })).toBe('insufficient')
        expect(reviewStatus({ belowThreshold: true, resultsCount: 2 })).toBe('review')
        expect(reviewStatus({ belowThreshold: false, resultsCount: 3 })).toBe('ok')
        expect(trendText({ change: null, direction: null })).toBeNull()
        expect(trendText({ change: -12.5, direction: 'down' })).toBe('Bajó 12.5 pts')
    })
})

describe('Evaluaciones de un aula', () => {
    it('desde /evaluaciones se elige el aula', async () => {
        createAssessmentBackend()
        const { router } = renderRoute('/evaluaciones')
        await u().click(await screen.findByRole('link', { name: 'Primero A' }))
        await waitFor(() => expect(router.state.location.pathname).toBe(`/aulas/${CLASSROOM.id}/evaluaciones`))
    })

    it('lista las evaluaciones con su escala, de la más reciente a la más antigua, y filtra en el backend', async () => {
        const { calls } = createAssessmentBackend({ assessments: threeAssessments })
        renderRoute(`/aulas/${CLASSROOM.id}/evaluaciones`)
        const table = await screen.findByRole('table')
        const titles = within(table).getAllByRole('link').map((a) => a.textContent)
        expect(titles).toEqual(['Prueba 3', 'Prueba 2', 'Prueba 1'])
        expect(within(rowOf('Prueba 1')).getByText('Escala: 0 a 10')).toBeInTheDocument()
        expect(within(rowOf('Prueba 3')).getByText('Escala: 0 a 100')).toBeInTheDocument()

        await u().selectOptions(screen.getByLabelText('Tipo'), 'sumativa')
        expect(await screen.findByText('Ninguna evaluación coincide con los filtros')).toBeInTheDocument()
        expect(lastCall(calls, 'GET', '/assessments').params).toEqual({ classroomId: CLASSROOM.id, assessmentType: 'sumativa' })
    })

    it('crea una evaluación con materia, tema, fecha, metodología, puntuación máxima y tipo', async () => {
        const { calls } = createAssessmentBackend()
        const { router } = renderRoute(`/aulas/${CLASSROOM.id}/evaluaciones`)
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Nueva evaluación' }))
        const modal = await screen.findByRole('dialog')

        await user.click(within(modal).getByRole('button', { name: 'Crear evaluación' }))
        expect(within(modal).getByText('El título es obligatorio')).toBeInTheDocument()
        expect(within(modal).getByText('Selecciona una materia')).toBeInTheDocument()
        expect(within(modal).getByText(/La puntuación máxima debe ser mayor que 0/)).toBeInTheDocument()
        expect(within(modal).getByText('Selecciona el tipo de evaluación')).toBeInTheDocument()
        expect(within(modal).getByLabelText(/^fecha/i)).toHaveValue(todayISO())

        await user.type(within(modal).getByLabelText(/^título/i), 'Prueba corta')
        await user.selectOptions(within(modal).getByLabelText(/^materia/i), SUB.id)
        await waitFor(() => expect(within(modal).getByLabelText(/^tema/i)).toBeEnabled())
        await user.selectOptions(within(modal).getByLabelText(/^tema/i), TOPIC.id)
        const date = within(modal).getByLabelText(/^fecha/i)
        await user.clear(date)
        await user.type(date, '2026-05-04')
        await user.type(within(modal).getByLabelText(/puntuación máxima/i), '1001')
        await user.selectOptions(within(modal).getByLabelText(/^tipo/i), 'formativa')
        await user.selectOptions(within(modal).getByLabelText(/^metodología/i), METHOD.id)
        await user.click(within(modal).getByRole('button', { name: 'Crear evaluación' }))
        expect(within(modal).getByText(/hasta 1000/)).toBeInTheDocument()

        await user.clear(within(modal).getByLabelText(/puntuación máxima/i))
        await user.type(within(modal).getByLabelText(/puntuación máxima/i), '20')
        await user.click(within(modal).getByRole('button', { name: 'Crear evaluación' }))

        await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/evaluaciones\/650/))
        expect(lastCall(calls, 'POST', '/assessments').body).toEqual({
            title: 'Prueba corta',
            classroomId: CLASSROOM.id,
            subjectId: SUB.id,
            topicId: TOPIC.id,
            teachingMethodId: METHOD.id,
            assessmentDate: '2026-05-04',
            maxScore: 20,
            assessmentType: 'formativa'
        })
        expect(await screen.findByRole('heading', { name: 'Prueba corta', level: 1 })).toBeInTheDocument()
        expect(screen.getByText('Escala: 0 a 20')).toBeInTheDocument()
    })
})

describe('Registro de calificaciones', () => {
    const open = async (options = {}) => {
        const backend = createAssessmentBackend({ assessments: [{ title: 'Prueba 1', assessmentDate: '2026-03-01T00:00:00.000Z', maxScore: 20 }], ...options })
        const view = renderRoute(`/evaluaciones/${backend.db.assessments[0].id}`)
        await screen.findByRole('heading', { name: 'Prueba 1', level: 1 })
        return { ...backend, ...view }
    }

    it('identifica a los estudiantes por código, distingue cero de sin calificación y envía solo los que tienen nota', async () => {
        const { calls, studentByCode } = await open()
        const user = u()
        expect(within(rowOf('A01')).getAllByText('Sin calificación').length).toBeGreaterThan(0)

        await user.type(screen.getByLabelText('Nota de A01 (de 0 a 20)'), '15,5{enter}')
        expect(screen.getByLabelText('Nota de A02 (de 0 a 20)')).toHaveFocus() // Enter pasa al siguiente
        await user.type(screen.getByLabelText('Nota de A02 (de 0 a 20)'), '0')
        await user.type(screen.getByLabelText('Observaciones de A02'), 'No entregó a tiempo')
        expect(within(rowOf('A02')).getByText('0 %')).toBeInTheDocument()
        expect(within(rowOf('A03')).getAllByText('Sin calificación').length).toBeGreaterThan(0)
        expect(screen.getByText('2 cambios sin guardar')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Guardar calificaciones' }))
        expect(await screen.findByText('Calificaciones guardadas: 2 nuevas.')).toBeInTheDocument()
        const body = lastCall(calls, 'POST', '/assessments/').body
        expect(body).toEqual({
            results: [
                { studentId: studentByCode('A01').id, score: 15.5 },
                { studentId: studentByCode('A02').id, score: 0, observations: 'No entregó a tiempo' }
            ]
        })
        expect(JSON.stringify(body)).not.toContain('studentCode')
        // La tabla se recarga con lo guardado
        await waitFor(() => expect(within(rowOf('A02')).getByText('Registrada')).toBeInTheDocument())
        expect(within(rowOf('A03')).getAllByText('Sin calificación').length).toBeGreaterThan(0)
    })

    it('no envía notas inválidas ni mayores que la puntuación máxima', async () => {
        const { calls } = await open()
        const user = u()
        await user.type(screen.getByLabelText('Nota de A01 (de 0 a 20)'), '25')
        expect(within(rowOf('A01')).getByText('La nota no puede superar 20')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Guardar calificaciones' }))
        expect(screen.getByText(/Hay una nota por revisar/)).toBeInTheDocument()
        expect(calls.some((c) => c.method === 'POST')).toBe(false)
        expect(screen.getByLabelText('Nota de A01 (de 0 a 20)')).toHaveFocus()
    })

    it('corregir una nota registrada pide un motivo opcional y conserva la anterior; no se puede borrar', async () => {
        const { calls, studentByCode } = await open({ results: [{ assessment: 0, code: 'A01', score: 12 }] })
        const user = u()
        const input = screen.getByLabelText('Nota de A01 (de 0 a 20)')
        expect(input).toHaveValue('12')

        await user.clear(input)
        expect(within(rowOf('A01')).getByText(/no se puede quitar/)).toBeInTheDocument()

        await user.type(input, '14')
        expect(within(rowOf('A01')).getByText('Antes: 12 / 20')).toBeInTheDocument()
        expect(within(rowOf('A01')).getByText('Corrección')).toBeInTheDocument()
        await user.type(screen.getByLabelText('Motivo de la corrección de A01 (opcional)'), 'Error al sumar')
        await user.click(screen.getByRole('button', { name: 'Guardar calificaciones' }))

        expect(await screen.findByText('Calificaciones guardadas: 1 corregida.')).toBeInTheDocument()
        expect(lastCall(calls, 'POST', '/assessments/').body).toEqual({ results: [{ studentId: studentByCode('A01').id, score: 14, correctionReason: 'Error al sumar' }] })
        expect(await within(rowOf('A01')).findByText('Corregida 1 vez')).toBeInTheDocument()
    })

    it('si el backend rechaza una fila, indica el código del estudiante', async () => {
        await open({ overrides: { 'POST /assessments/:id/results': () => fail(400, 'Errores de validación', [{ field: 'results[0].studentId', message: 'El estudiante no pertenece al aula evaluada' }]) } })
        const user = u()
        await user.type(screen.getByLabelText('Nota de A02 (de 0 a 20)'), '10')
        await user.click(screen.getByRole('button', { name: 'Guardar calificaciones' }))
        expect(await screen.findByText(/A02: El estudiante no pertenece al aula evaluada/)).toBeInTheDocument()
    })

    it('sin datos suficientes no muestra estadísticas', async () => {
        await open({ results: [{ assessment: 0, code: 'A01', score: 10 }, { assessment: 0, code: 'A02', score: 20 }] })
        expect(screen.getByText(/Las estadísticas se calculan con al menos 3 calificaciones/)).toBeInTheDocument()
        expect(screen.queryByText('75 %')).not.toBeInTheDocument()
    })

    it('con datos suficientes muestra promedio y mediana', async () => {
        await open({ results: [{ assessment: 0, code: 'A01', score: 10 }, { assessment: 0, code: 'A02', score: 20 }, { assessment: 0, code: 'A03', score: 15 }] })
        expect(screen.getAllByText('75 %').length).toBeGreaterThan(0)
        expect(screen.queryByText(/Las estadísticas se calculan con al menos/)).not.toBeInTheDocument()
        expect(screen.getByText(/no es un diagnóstico/)).toBeInTheDocument()
    })
})

describe('Seguimiento del aula', () => {
    // Prueba 1 (feb, /10), Prueba 2 (mar, /20), Prueba 3 (abr, /100)
    const results = [
        { assessment: 1, code: 'A01', score: 9 },
        { assessment: 0, code: 'A01', score: 18 },
        { assessment: 2, code: 'A01', score: 95 },
        { assessment: 1, code: 'A02', score: 4 },
        { assessment: 0, code: 'A02', score: 10 },
        { assessment: 2, code: 'A02', score: 40 },
        { assessment: 1, code: 'A03', score: 5 },
        { assessment: 0, code: 'A03', score: 20 }
    ]

    it('muestra cifras, evolución cronológica e indicadores con umbral configurable', async () => {
        const { calls } = createAssessmentBackend({ assessments: threeAssessments, results })
        const { router } = renderRoute(`/aulas/${CLASSROOM.id}/evaluaciones?vista=seguimiento`)
        const user = u()

        expect(await screen.findByText(/no es un diagnóstico/)).toBeInTheDocument()
        expect(rowOf('A02')).toHaveTextContent('Revisión sugerida') // promedio (40+50+40)/3 ≈ 43 %
        expect(rowOf('A01')).toHaveTextContent('Sobre el umbral')
        expect(rowOf('A01')).toHaveTextContent('Subió') // 90 % → 90 % → 95 %
        expect(rowOf('A03')).toHaveTextContent('2') // dos calificaciones

        // Evolución: solo evaluaciones con 3 o más calificaciones, de la más antigua a la más reciente
        // Prueba 3 tiene solo 2 calificaciones: no entra en la evolución del promedio
        await user.click(await screen.findByRole('button', { name: 'Ver datos del gráfico' }))
        const dataRows = within(screen.getByRole('table', { name: 'Datos del gráfico, en orden cronológico' })).getAllByRole('row').slice(1)
        expect(dataRows.map((r) => within(r).getAllByRole('cell')[1].textContent)).toEqual(['Prueba 1', 'Prueba 2'])
        expect(screen.getByRole('img', { name: /Promedio de logro del aula en 2 evaluaciones/ })).toBeInTheDocument()

        await user.clear(screen.getByLabelText('Umbral de revisión'))
        await user.type(screen.getByLabelText('Umbral de revisión'), '95')
        await user.click(screen.getByRole('button', { name: 'Aplicar' }))
        await waitFor(() => expect(lastCall(calls, 'GET', '/classrooms/').params).toEqual({ threshold: 95 }))
        expect(new URLSearchParams(router.state.location.search).get('umbral')).toBe('95')
        await waitFor(() => expect(rowOf('A01')).toHaveTextContent('Revisión sugerida'))

        await user.clear(screen.getByLabelText('Umbral de revisión'))
        await user.type(screen.getByLabelText('Umbral de revisión'), '150')
        await user.click(screen.getByRole('button', { name: 'Aplicar' }))
        expect(screen.getByText('El umbral debe estar entre 0 y 100')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Usar el predeterminado' }))
        await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('umbral')).toBeNull())
        await waitFor(() => expect(rowOf('A01')).toHaveTextContent('Sobre el umbral'))
        await user.click(screen.getByRole('checkbox', { name: 'Solo con revisión sugerida' }))
        expect(screen.getByRole('link', { name: 'A02' })).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'A01' })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'A03' })).not.toBeInTheDocument()
    })

    it('sin evaluaciones no genera estadísticas', async () => {
        createAssessmentBackend()
        renderRoute(`/aulas/${CLASSROOM.id}/evaluaciones?vista=seguimiento`)
        expect(await screen.findByText('Aún no hay evaluaciones')).toBeInTheDocument()
    })

    it('con pocas calificaciones avisa que los datos son insuficientes', async () => {
        createAssessmentBackend({ assessments: threeAssessments, results: results.slice(0, 2) })
        renderRoute(`/aulas/${CLASSROOM.id}/evaluaciones?vista=seguimiento`)
        expect(await screen.findByText(/Se necesitan al menos 3 calificaciones registradas para calcular estadísticas del aula/)).toBeInTheDocument()
        expect(screen.getByText(/Para mostrar la evolución se necesitan al menos 2 evaluaciones/)).toBeInTheDocument()
    })
})

describe('Historial del estudiante', () => {
    it('muestra la evolución y el historial en orden cronológico con la escala de cada evaluación', async () => {
        const { studentByCode } = createAssessmentBackend({
            assessments: threeAssessments,
            results: [
                { assessment: 2, code: 'A02', score: 40 },
                { assessment: 1, code: 'A02', score: 8, observations: 'Buen avance' }
            ]
        })
        renderRoute(`/estudiantes/${studentByCode('A02').id}/seguimiento`)

        expect(await screen.findByRole('heading', { name: 'A02', level: 1 })).toBeInTheDocument()
        const history = screen.getByRole('table', { name: 'Historial de calificaciones en orden cronológico' })
        const rows = within(history).getAllByRole('row').slice(1)
        expect(rows.map((r) => within(r).getAllByRole('cell')[1].textContent)).toEqual(['Prueba 1', 'Prueba 3'])
        expect(rows[0]).toHaveTextContent('8 / 10')
        expect(rows[0]).toHaveTextContent('80 %')
        expect(rows[0]).toHaveTextContent('Buen avance')
        expect(rows[1]).toHaveTextContent('40 / 100')
        expect(screen.getByText(/1 evaluación del aula sin calificación de este estudiante \(no cuentan como cero\)/)).toBeInTheDocument()

        // Promedio (80 + 40) / 2 = 60 → no es menor que 60: sobre el umbral; tendencia bajó 40 pts
        expect(screen.getByText('Sobre el umbral')).toBeInTheDocument()
        expect(screen.getByText('-40 pts')).toBeInTheDocument()

        await u().click(await screen.findByRole('button', { name: 'Ver datos del gráfico' }))
        const chartRows = within(screen.getByRole('table', { name: 'Datos del gráfico, en orden cronológico' })).getAllByRole('row').slice(1)
        expect(chartRows.map((r) => within(r).getAllByRole('cell')[1].textContent)).toEqual(['Prueba 1', 'Prueba 3'])
    })

    it('con una sola calificación no calcula promedio, tendencia ni evolución', async () => {
        const { studentByCode } = createAssessmentBackend({ assessments: threeAssessments, results: [{ assessment: 0, code: 'A01', score: 5 }] })
        renderRoute(`/estudiantes/${studentByCode('A01').id}/seguimiento`)
        expect(await screen.findByText(/Se necesitan al menos 2 calificaciones para calcular el promedio/)).toBeInTheDocument()
        expect(screen.getByText(/Para mostrar la evolución se necesitan al menos 2 calificaciones/)).toBeInTheDocument()
        expect(screen.getAllByText('Datos insuficientes').length).toBeGreaterThan(0)
        expect(screen.queryByText('Revisión sugerida')).not.toBeInTheDocument()
    })

    it('un estudiante ajeno o inexistente (404) no muestra datos', async () => {
        createAssessmentBackend()
        renderRoute('/estudiantes/64f0000000000000000000ff/seguimiento')
        expect(await screen.findByText('Estudiante no encontrado')).toBeInTheDocument()
    })

    it('se abre desde la tabla de estudiantes del aula', async () => {
        const { studentByCode } = createAssessmentBackend({
            overrides: { 'GET /classrooms/:id/students': () => ({ status: 200, body: { success: true, data: { students: [{ id: studentByCodeRef.id, studentCode: 'A01', classroomId: CLASSROOM.id, isActive: true }] } } }) }
        })
        const studentByCodeRef = studentByCode('A01')
        renderRoute(`/aulas/${CLASSROOM.id}`)
        expect(await screen.findByRole('link', { name: 'Historial de A01' })).toHaveAttribute('href', `/estudiantes/${studentByCodeRef.id}/seguimiento`)
        expect(screen.getAllByRole('link', { name: 'Evaluaciones' }).some((a) => a.getAttribute('href') === `/aulas/${CLASSROOM.id}/evaluaciones`)).toBe(true)
    })
})
