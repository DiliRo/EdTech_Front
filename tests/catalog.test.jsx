import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute, renderWithTheme } from './renderWithProviders.jsx'
import { tokenStorage } from '../src/utils/tokenStorage.js'
import { mockApi, fakeToken, TEACHER, ok, fail, healthy, networkError } from './mockApi.js'
import { getAllTopics, getGrades, getTopic } from '../src/services/catalog.service.js'
import { TopicDetail } from '../src/components/catalog/TopicDetail.jsx'
import { matchesSearch } from '../src/utils/text.js'

// Respuestas con la misma forma que el backend B3 (ids de MongoDB, referencias pobladas).
// Son datos de prueba de los tests, no contenido curricular.
const G1 = { id: '64b000000000000000000001', number: 1, name: 'Primer grado', level: 'primaria' }
const G2 = { id: '64b000000000000000000002', number: 2, name: 'Segundo grado', level: 'primaria' }
const GRADES = [G1, G2]

const S_MATH = { id: '64c000000000000000000001', code: 'mat', name: 'Materia A', description: 'Descripción de la materia A', grades: [G1, G2], isSample: false }
const S_COM = { id: '64c000000000000000000002', code: 'com', name: 'Materia B', description: '', grades: [G1], isSample: false }

const T1 = {
    id: '64d000000000000000000001',
    code: 'tema-1',
    name: 'Números y operación',
    description: 'Descripción del tema uno',
    grade: G1,
    subject: { id: S_MATH.id, code: 'mat', name: 'Materia A' },
    competencies: [{ code: 'C1', description: 'Competencia del tema uno' }],
    achievementIndicators: [{ code: 'C1.1', competencyCode: 'C1', description: 'Indicador del tema uno' }],
    curriculumReference: { document: 'Documento curricular X', version: '2008', page: '45', url: 'https://example.org/cnb.pdf' },
    isSample: false,
    source: { type: 'cnb', document: 'Documento curricular X', importedAt: '2026-01-01T00:00:00.000Z' }
}
const T2 = { ...T1, id: '64d000000000000000000002', code: 'tema-2', name: 'Geometría básica', description: 'Figuras', competencies: [], achievementIndicators: [] }

const topicsResponse = (topics, extra = {}) => ({
    status: 200,
    body: {
        success: true,
        message: 'Temas',
        data: { topics },
        meta: { page: 1, limit: 100, total: topics.length, totalPages: topics.length ? 1 : 0, containsSampleData: false, ...extra }
    }
})

/** Backend B3 simulado: responde según los parámetros, como el real. */
const catalogApi = (overrides = {}) => {
    tokenStorage.set(fakeToken())
    return mockApi({
        'GET /auth/me': () => ok({ teacher: TEACHER }),
        'GET /health': healthy,
        'GET /grades': () => ok({ grades: GRADES }, 'Grados'),
        'GET /subjects': ({ params }) => {
            const subjects = [S_MATH, S_COM].filter((s) => s.grades.some((g) => g.id === params.grade))
            return { status: 200, body: { success: true, message: 'Materias', data: { subjects }, meta: { containsSampleData: false } } }
        },
        'GET /topics': ({ params }) => topicsResponse([T1, T2].filter((t) => t.grade.id === params.grade && t.subject.id === params.subject)),
        [`GET /topics/${T1.id}`]: () => ({ status: 200, body: { success: true, message: 'Tema', data: { topic: T1 }, meta: { containsSampleData: false } } }),
        [`GET /topics/${T2.id}`]: () => ({ status: 200, body: { success: true, message: 'Tema', data: { topic: T2 }, meta: { containsSampleData: false } } }),
        ...overrides
    })
}

const u = () => userEvent.setup()
const searchOf = (router) => Object.fromEntries(new URLSearchParams(router.state.location.search))

describe('Servicios del catálogo (B3)', () => {
    it('getGrades pide los grados de primaria', async () => {
        const calls = mockApi({ 'GET /grades': () => ok({ grades: GRADES }) })
        expect(await getGrades()).toEqual(GRADES)
        expect(calls[0].params).toEqual({ level: 'primaria' })
    })

    it('getAllTopics recorre todas las páginas con el límite máximo del backend', async () => {
        const calls = mockApi({
            'GET /topics': ({ params }) =>
                topicsResponse(params.page === 1 ? [T1] : [T2], { page: params.page, total: 2, totalPages: 2, containsSampleData: params.page === 2 })
        })
        const result = await getAllTopics({ grade: G1.id, subject: S_MATH.id })
        expect(result.topics.map((t) => t.id)).toEqual([T1.id, T2.id])
        expect(result).toMatchObject({ total: 2, containsSampleData: true, isTruncated: false })
        expect(calls.map((c) => c.params)).toEqual([
            { grade: G1.id, subject: S_MATH.id, page: 1, limit: 100 },
            { grade: G1.id, subject: S_MATH.id, page: 2, limit: 100 }
        ])
    })

    it('getTopic devuelve el tema y el aviso de datos de prueba', async () => {
        mockApi({ [`GET /topics/${T1.id}`]: () => ({ status: 200, body: { success: true, data: { topic: T1 }, meta: { containsSampleData: true } } }) })
        expect(await getTopic(T1.id)).toEqual({ topic: T1, containsSampleData: true })
    })

    it('la búsqueda ignora mayúsculas y tildes', () => {
        expect(matchesSearch('GEOMETRIA', ['Geometría básica'])).toBe(true)
        expect(matchesSearch('numeros operacion', ['Números y operación'])).toBe(true)
        expect(matchesSearch('fracciones', ['Números y operación'])).toBe(false)
        expect(matchesSearch('  ', ['cualquiera'])).toBe(true)
    })
})

describe('Página de currículo', () => {
    it('está en el menú lateral', async () => {
        catalogApi()
        renderRoute('/dashboard')
        const nav = (await screen.findAllByRole('navigation', { name: 'Menú principal' }))[0]
        expect(within(nav).getByRole('link', { name: /currículo/i })).toHaveAttribute('href', '/curriculo')
    })

    it('muestra los grados y no consulta materias hasta elegir uno', async () => {
        const calls = catalogApi()
        renderRoute('/curriculo')
        const group = await screen.findByRole('radiogroup', { name: 'Grados de primaria' })
        expect(within(group).getAllByRole('radio')).toHaveLength(2)
        expect(within(group).getByRole('radio', { name: /primer grado/i })).not.toBeChecked()
        expect(calls.some((c) => c.url === '/subjects')).toBe(false)
        expect(screen.queryByText(/paso 2/i)).not.toBeInTheDocument()
    })

    it('recorre grado → materia → tema y muestra el contenido curricular', async () => {
        const calls = catalogApi()
        const { router } = renderRoute('/curriculo')
        const user = u()

        await user.click(await screen.findByRole('radio', { name: /primer grado/i }))
        expect(await screen.findByRole('radio', { name: /materia a/i })).toBeInTheDocument()
        expect(screen.getByRole('radio', { name: /materia b/i })).toBeInTheDocument()
        expect(calls.find((c) => c.url === '/subjects').params).toEqual({ grade: G1.id })

        await user.click(screen.getByRole('radio', { name: /materia a/i }))
        expect(await screen.findByRole('radio', { name: /números y operación/i })).toBeInTheDocument()
        expect(calls.find((c) => c.url === '/topics').params).toEqual({ grade: G1.id, subject: S_MATH.id, page: 1, limit: 100 })

        await user.click(screen.getByRole('radio', { name: /números y operación/i }))
        expect(await screen.findByRole('heading', { name: 'Números y operación', level: 3 })).toBeInTheDocument()
        expect(within(screen.getByRole('region', { name: 'Descripción' })).getByText('Descripción del tema uno')).toBeInTheDocument()
        expect(within(screen.getByRole('region', { name: 'Competencias' })).getByText('Competencia del tema uno')).toBeInTheDocument()
        expect(within(screen.getByRole('region', { name: 'Indicadores de logro' })).getByText('Indicador del tema uno')).toBeInTheDocument()
        expect(screen.getByText('Documento curricular X')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /abrir documento/i })).toHaveAttribute('href', 'https://example.org/cnb.pdf')
        expect(screen.getByRole('radio', { name: /números y operación/i })).toBeChecked()
        expect(searchOf(router)).toEqual({ grado: G1.id, materia: S_MATH.id, tema: T1.id })
    })

    it('solo muestra las materias del grado elegido y al cambiar de grado borra materia y tema', async () => {
        catalogApi()
        const { router } = renderRoute(`/curriculo?grado=${G1.id}&materia=${S_MATH.id}&tema=${T1.id}`)
        expect(await screen.findByRole('heading', { name: 'Números y operación', level: 3 })).toBeInTheDocument()

        await u().click(screen.getByRole('radio', { name: /segundo grado/i }))
        await waitFor(() => expect(searchOf(router)).toEqual({ grado: G2.id }))
        expect(await screen.findByRole('radio', { name: /materia a/i })).not.toBeChecked()
        expect(screen.queryByRole('radio', { name: /materia b/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Números y operación' })).not.toBeInTheDocument()
    })

    it('ignora ids de la URL que no existen en el catálogo', async () => {
        const calls = catalogApi()
        renderRoute('/curriculo?grado=64b0000000000000000000ff')
        await screen.findByRole('radiogroup', { name: 'Grados de primaria' })
        expect(screen.getAllByRole('radio').every((radio) => !radio.checked)).toBe(true)
        expect(calls.some((c) => c.url === '/subjects')).toBe(false)
    })

    it('busca temas sin importar tildes y avisa cuando no hay resultados', async () => {
        catalogApi()
        renderRoute(`/curriculo?grado=${G1.id}&materia=${S_MATH.id}`)
        const user = u()
        const search = await screen.findByLabelText('Buscar tema')

        await user.type(search, 'geometria')
        expect(screen.getByRole('radio', { name: /geometría básica/i })).toBeInTheDocument()
        expect(screen.queryByRole('radio', { name: /números/i })).not.toBeInTheDocument()
        expect(screen.getByText('1 de 2 temas coinciden')).toBeInTheDocument()

        await user.clear(search)
        await user.type(search, 'fracciones')
        expect(screen.getByText('Ningún tema coincide con tu búsqueda')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
        expect(search).toHaveValue('')
        expect(screen.getAllByRole('radio', { name: /números|geometría/i })).toHaveLength(2)
    })

    it('catálogo sin grados: explica que aún no está disponible', async () => {
        catalogApi({ 'GET /grades': () => ok({ grades: [] }) })
        renderRoute('/curriculo')
        expect(await screen.findByText('El catálogo curricular aún no está disponible')).toBeInTheDocument()
    })

    it('grado sin materias y materia sin temas muestran mensajes claros', async () => {
        catalogApi({ 'GET /topics': () => topicsResponse([]) })
        renderRoute(`/curriculo?grado=${G2.id}&materia=${S_MATH.id}`)
        expect(await screen.findByText('No hay temas registrados')).toBeInTheDocument()
        expect(screen.getByText(/todavía no incluye temas de Materia A para Segundo grado/)).toBeInTheDocument()
    })

    it('grado sin materias', async () => {
        catalogApi({ 'GET /subjects': () => ({ status: 200, body: { success: true, data: { subjects: [] }, meta: { containsSampleData: false } } }) })
        renderRoute(`/curriculo?grado=${G1.id}`)
        expect(await screen.findByText('No hay materias registradas para Primer grado')).toBeInTheDocument()
    })

    it('error al cargar grados: mensaje sin detalles técnicos y reintento', async () => {
        let attempts = 0
        catalogApi({ 'GET /grades': () => (++attempts === 1 ? networkError() : ok({ grades: GRADES })) })
        renderRoute('/curriculo')
        const alert = await screen.findByRole('alert')
        expect(alert).toHaveTextContent('No se pudieron cargar los grados')
        expect(alert).not.toHaveTextContent(/Network Error|ERR_/)
        await u().click(within(alert).getByRole('button', { name: /reintentar/i }))
        expect(await screen.findByRole('radio', { name: /primer grado/i })).toBeInTheDocument()
    })

    it('tema no encontrado (404): muestra el mensaje del backend', async () => {
        catalogApi({ [`GET /topics/${T1.id}`]: () => fail(404, 'Tema no encontrado') })
        renderRoute(`/curriculo?grado=${G1.id}&materia=${S_MATH.id}&tema=${T1.id}`)
        expect(await screen.findByText('No se pudo cargar el contenido del tema')).toBeInTheDocument()
        expect(screen.getByText('Tema no encontrado')).toBeInTheDocument()
    })

    it('avisa cuando las materias son datos de prueba', async () => {
        catalogApi({
            'GET /subjects': () => ({ status: 200, body: { success: true, data: { subjects: [{ ...S_MATH, isSample: true }] }, meta: { containsSampleData: true } } })
        })
        renderRoute(`/curriculo?grado=${G1.id}`)
        expect(await screen.findByText(/algunas materias son de prueba/i)).toBeInTheDocument()
        expect(screen.getByText('Prueba')).toBeInTheDocument()
    })
})

describe('Detalle de un tema', () => {
    it('indica la ausencia de competencias e indicadores sin inventar contenido', () => {
        renderWithTheme(<TopicDetail topic={T2} />)
        expect(screen.getByText('Figuras')).toBeInTheDocument()
        expect(screen.getByText('No hay competencias registradas para este tema.')).toBeInTheDocument()
        expect(screen.getByText('No hay indicadores de logro registrados para este tema.')).toBeInTheDocument()
    })

    it('tema sin ninguna información curricular', () => {
        renderWithTheme(<TopicDetail topic={{ ...T2, description: '', curriculumReference: {}, source: undefined }} />)
        expect(screen.getByText('Este tema aún no tiene información curricular')).toBeInTheDocument()
        expect(screen.getByText('El catálogo no registra la referencia curricular de este tema.')).toBeInTheDocument()
    })

    it('datos de prueba: muestra el aviso de que no es contenido oficial', () => {
        renderWithTheme(<TopicDetail topic={{ ...T1, isSample: true }} />)
        expect(screen.getByText(/no proviene del CNB/)).toBeInTheDocument()
    })

    it('no convierte en enlace una URL que no sea http(s)', () => {
        renderWithTheme(<TopicDetail topic={{ ...T1, curriculumReference: { document: 'Doc', url: 'javascript:alert(1)' } }} />)
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
})
