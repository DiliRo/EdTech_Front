import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './renderWithProviders.jsx'
import { fail } from './mockApi.js'
import { createMethodologyBackend, defaultMethod, customMethod, G1, S2 } from './methodologyBackend.js'
import { toMethodologyFormValues, toMethodologyPayload, validateMethodology, formatDuration } from '../src/utils/methodology.js'

const u = () => userEvent.setup()
const lastCall = (calls, method, urlStart) => [...calls].reverse().find((c) => c.method === method && c.url.startsWith(urlStart))
const cardOf = async (name) => (await screen.findByRole('link', { name })).closest('.chakra-card')

describe('Utilidades de metodologías', () => {
    it('formatea la duración', () => {
        expect(formatDuration(null)).toBeNull()
        expect(formatDuration({ minMinutes: 30, maxMinutes: 45 })).toBe('30–45 min')
        expect(formatDuration({ minMinutes: 40, maxMinutes: 40 })).toBe('40 min')
    })

    it('arma el cuerpo con los nombres del contrato y omite elementos vacíos', () => {
        const values = toMethodologyFormValues(null)
        Object.assign(values, {
            name: ' Mi método ',
            description: ' Algo ',
            objectives: ['Uno', '  '],
            steps: [{ title: '', description: 'Hacer A' }, { title: '', description: '' }],
            suggestedActivities: [{ title: 'Juego', description: '' }],
            materials: ['Hojas', ''],
            estimatedDuration: { min: '20', max: '' },
            learningPreferences: ['visual', 'colaborativa'],
            sourceReference: { title: '', institution: '', year: '2020', section: '', pages: '', url: '', notes: '' }
        })
        expect(toMethodologyPayload(values)).toEqual({
            name: 'Mi método',
            description: 'Algo',
            objectives: ['Uno'],
            steps: [{ description: 'Hacer A' }],
            suggestedActivities: [{ title: 'Juego' }],
            materials: ['Hojas'],
            estimatedDuration: { minMinutes: 20, maxMinutes: 20 },
            compatibleGrades: [],
            compatibleSubjects: [],
            learningPreferences: ['visual', 'colaborativa'],
            sourceReference: { year: 2020 }
        })
    })

    it('valida como el backend: una sola preferencia, duración invertida, paso sin descripción', () => {
        const values = { ...toMethodologyFormValues(null), name: 'X', description: 'Y' }
        expect(validateMethodology({ ...values, learningPreferences: ['visual'] }).learningPreferences).toMatch(/al menos dos/)
        expect(validateMethodology({ ...values, estimatedDuration: { min: '60', max: '30' } }).estimatedDuration).toMatch(/mínima no puede ser mayor/)
        expect(validateMethodology({ ...values, estimatedDuration: { min: '2', max: '' } }).estimatedDuration).toMatch(/entre 5 y 600/)
        expect(validateMethodology({ ...values, steps: [{ title: 'Inicio', description: '' }] }).steps).toBe('Paso 1: la descripción es obligatoria')
        expect(Object.values(validateMethodology(values)).every((e) => e === null)).toBe(true)
    })
})

describe('Listado de metodologías', () => {
    it('muestra predeterminadas y personalizadas diferenciadas, con duración y materiales', async () => {
        createMethodologyBackend({ methods: [defaultMethod({ name: 'Diálogo de prueba' }), customMethod({ name: 'Mi estrategia' })] })
        renderRoute('/metodologias')

        const def = await cardOf('Diálogo de prueba')
        expect(def).toHaveTextContent('Predeterminada')
        expect(def).toHaveTextContent('Duración no indicada')
        expect(def).toHaveTextContent('Sin materiales indicados')
        expect(def).toHaveTextContent('Auditiva y oral') // etiqueta del catálogo del backend

        const mine = await cardOf('Mi estrategia')
        expect(mine).toHaveTextContent('Personalizada')
        expect(mine).toHaveTextContent('Duración: 30–45 min')
        expect(mine).toHaveTextContent('Materiales: Tarjetas, Pizarrón, Marcadores y 1 más')

        expect(screen.getByText(/Ninguna metodología es mejor en todos los casos/)).toBeInTheDocument()
        expect(screen.queryByText(/recomendada|la mejor/i)).not.toBeInTheDocument()
    })

    it('envía los filtros al backend y los guarda en la URL', async () => {
        const { calls } = createMethodologyBackend({
            methods: [
                defaultMethod({ name: 'Para todos' }),
                customMethod({ name: 'Solo segundo', compatibleGrades: ['64b000000000000000000002'] }),
                customMethod({ name: 'Corta', estimatedDuration: { minMinutes: 20, maxMinutes: 30 }, learningPreferences: ['visual', 'kinestesica'] })
            ]
        })
        const { router } = renderRoute('/metodologias')
        const user = u()
        await cardOf('Para todos')

        await user.selectOptions(screen.getByLabelText('Grado'), G1.id)
        await waitFor(() => expect(screen.queryByRole('link', { name: 'Solo segundo' })).not.toBeInTheDocument())
        await waitFor(() => expect(screen.getByLabelText('Materia')).toBeEnabled())
        await user.selectOptions(screen.getByLabelText('Materia'), S2.id)
        await user.selectOptions(screen.getByLabelText('Tiempo disponible'), '30')
        await user.click(screen.getByRole('checkbox', { name: 'Visual' }))
        await user.click(screen.getByRole('checkbox', { name: 'Kinestésica y manipulativa' }))

        expect(await cardOf('Corta')).toBeInTheDocument()
        await waitFor(() => expect(screen.queryByRole('link', { name: 'Para todos' })).not.toBeInTheDocument())
        expect(lastCall(calls, 'GET', '/methodologies').params).toEqual({
            scope: 'all',
            grade: G1.id,
            subject: S2.id,
            maxDuration: 30,
            learningPreferences: 'visual,kinestesica'
        })
        expect(Object.fromEntries(new URLSearchParams(router.state.location.search))).toEqual({
            grado: G1.id,
            materia: S2.id,
            duracion: '30',
            preferencias: 'visual,kinestesica'
        })

        await user.click(screen.getByRole('radio', { name: 'Predeterminadas' }))
        expect(await screen.findByText('Ninguna metodología coincide con los filtros')).toBeInTheDocument()
        await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0])
        expect(await cardOf('Para todos')).toBeInTheDocument()
        expect(router.state.location.search).toBe('')
        expect(lastCall(calls, 'GET', '/methodologies').params).toEqual({ scope: 'all' })
    })

    it('"Mis metodologías" vacío invita a crear una', async () => {
        createMethodologyBackend({ methods: [defaultMethod()] })
        renderRoute('/metodologias?tipo=mine')
        expect(await screen.findByText('Aún no has creado metodologías')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Crear metodología' })).toHaveAttribute('href', '/metodologias/nueva')
    })

    it('error al cargar: mensaje y reintento', async () => {
        let attempts = 0
        createMethodologyBackend({
            methods: [defaultMethod({ name: 'Otra' })],
            overrides: {
                'GET /methodologies': ({ params }) =>
                    params.scope === 'mine'
                        ? { status: 200, body: { success: true, data: { methodologies: [] }, meta: { learningPreferences: [] } } }
                        : ++attempts === 1
                          ? fail(500, 'Ocurrió un error en el servidor')
                          : { status: 200, body: { success: true, data: { methodologies: [defaultMethod({ name: 'Otra' })] }, meta: { learningPreferences: [] } } }
            }
        })
        renderRoute('/metodologias')
        expect(await screen.findByText('No se pudieron cargar las metodologías')).toBeInTheDocument()
        await u().click(screen.getByRole('button', { name: /reintentar/i }))
        expect(await cardOf('Otra')).toBeInTheDocument()
    })
})

describe('Detalle', () => {
    it('predeterminada: objetivos, pasos, actividades, recursos y fuente; no se puede editar', async () => {
        const m = defaultMethod({ name: 'Diálogo de prueba' })
        createMethodologyBackend({ methods: [m] })
        renderRoute(`/metodologias/${m.id}`)

        expect(await screen.findByRole('heading', { name: 'Diálogo de prueba', level: 1 })).toBeInTheDocument()
        expect(within(screen.getByRole('region', { name: 'Objetivos' })).getByText('Objetivo de prueba uno')).toBeInTheDocument()
        const steps = within(screen.getByRole('region', { name: 'Pasos' })).getAllByRole('listitem')
        expect(steps).toHaveLength(2)
        expect(steps[0]).toHaveTextContent('Paso 1.')
        expect(steps[0]).toHaveTextContent('Inicio')
        expect(within(screen.getByRole('region', { name: 'Actividades sugeridas' })).getByText('Actividad de prueba')).toBeInTheDocument()
        expect(within(screen.getByRole('region', { name: 'Materiales y recursos' })).getByText('Esta metodología no indica materiales.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /abrir documento/i })).toHaveAttribute('href', 'https://example.org/doc.pdf')
        expect(screen.getByText('Aplicable a cualquier grado')).toBeInTheDocument()

        expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument()
        expect(screen.getByText(/no se puede editar/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Crear una propia basada en esta' })).toHaveAttribute('href', `/metodologias/nueva?basadaEn=${m.id}`)
    })

    it('la ruta de edición de una predeterminada no muestra el formulario', async () => {
        const m = defaultMethod()
        const { calls } = createMethodologyBackend({ methods: [m] })
        renderRoute(`/metodologias/${m.id}/editar`)
        expect(await screen.findByText('Las metodologías predeterminadas no se pueden editar')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
        expect(calls.some((c) => c.method === 'PATCH')).toBe(false)
    })

    it('metodología inexistente o de otro docente: 404 sin datos', async () => {
        createMethodologyBackend()
        renderRoute('/metodologias/64a0000000000000000000ff')
        expect(await screen.findByText('Metodología no encontrada')).toBeInTheDocument()
    })
})

describe('Selección para la próxima guía de clase', () => {
    it('se elige desde la tarjeta, se ve en el detalle y se guarda solo el id y el nombre', async () => {
        const m = customMethod({ name: 'Mi estrategia' })
        createMethodologyBackend({ methods: [defaultMethod({ name: 'Otra' }), m] })
        const { router } = renderRoute('/metodologias')
        const user = u()

        const card = await cardOf('Mi estrategia')
        await user.click(within(card).getByRole('button', { name: 'Usar en mi próxima guía' }))
        expect(within(card).getByRole('button', { name: 'Seleccionada para guía' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText(/Metodología elegida para tu próxima guía/)).toHaveTextContent('Mi estrategia')

        const stored = JSON.parse(window.sessionStorage.getItem('etamanik.guidePlanning'))
        expect(stored).toMatchObject({ teacherId: 'teacher-1', methodology: { id: m.id, name: 'Mi estrategia', isDefault: false } })
        expect(JSON.stringify(stored)).not.toContain('Tarjetas') // no guarda el contenido

        // Solo una a la vez
        const other = await cardOf('Otra')
        await user.click(within(other).getByRole('button', { name: 'Usar en mi próxima guía' }))
        expect(screen.getByText(/Metodología elegida para tu próxima guía/)).toHaveTextContent('Otra')
        expect(within(card).getByRole('button', { name: 'Usar en mi próxima guía' })).toHaveAttribute('aria-pressed', 'false')

        await user.click(within(other).getByRole('link', { name: 'Otra' }))
        await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/metodologias\/64a/))
        expect(await screen.findByRole('button', { name: 'Seleccionada para guía' })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Quitar selección' }))
        expect(screen.queryByText(/Metodología elegida para tu próxima guía/)).not.toBeInTheDocument()
        expect(window.sessionStorage.getItem('etamanik.guidePlanning')).toBeNull()
    })

    it('al cerrar sesión se borra la selección', async () => {
        const m = customMethod()
        createMethodologyBackend({ methods: [m] })
        const { router } = renderRoute(`/metodologias/${m.id}`)
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Usar en mi próxima guía' }))
        expect(window.sessionStorage.getItem('etamanik.guidePlanning')).not.toBeNull()

        await user.click(screen.getByRole('button', { name: /menú de ana ixcot/i }))
        await user.click(await screen.findByRole('menuitem', { name: /cerrar sesión/i }))
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(window.sessionStorage.getItem('etamanik.guidePlanning')).toBeNull()
    })

    it('la selección de otro docente no se muestra', async () => {
        window.sessionStorage.setItem('etamanik.guidePlanning', JSON.stringify({ teacherId: 'otro', methodology: { id: 'x', name: 'Ajena' } }))
        createMethodologyBackend({ methods: [defaultMethod()] })
        renderRoute('/metodologias')
        await cardOf('Estrategia predeterminada')
        expect(screen.queryByText('Ajena')).not.toBeInTheDocument()
    })
})

describe('Formulario de metodologías personalizadas', () => {
    it('valida y crea con los campos del contrato; luego abre el detalle', async () => {
        const { calls } = createMethodologyBackend()
        const { router } = renderRoute('/metodologias/nueva')
        const user = u()

        await user.click(await screen.findByRole('button', { name: 'Crear metodología' }))
        expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
        expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument()
        expect(document.activeElement).toHaveAttribute('id', 'name')

        await user.type(screen.getByLabelText(/^nombre/i), 'Rincón de lectura')
        await user.type(screen.getByLabelText(/^descripción/i), 'Espacio para leer en grupos.')
        await user.click(screen.getByRole('button', { name: 'Agregar objetivo' }))
        await user.type(screen.getByLabelText('Objetivo 1'), 'Fomentar la lectura')
        await user.click(screen.getByRole('button', { name: 'Agregar paso' }))
        await user.type(screen.getByLabelText('Descripción del paso 1'), 'Formar grupos')
        await user.click(screen.getByRole('button', { name: 'Agregar paso' }))
        await user.type(screen.getByLabelText('Título (opcional) del paso 2'), 'Leer')
        await user.type(screen.getByLabelText('Descripción del paso 2'), 'Leer en voz alta')
        await user.click(screen.getByRole('button', { name: 'Subir paso 2' }))
        await user.click(screen.getByRole('button', { name: 'Agregar material' }))
        await user.type(screen.getByLabelText('Material 1'), 'Libros')
        await user.type(screen.getByLabelText('Duración mínima en minutos'), '30')
        await user.type(screen.getByLabelText('Duración máxima en minutos'), '40')
        await user.click(await screen.findByRole('checkbox', { name: 'Primer grado' }))

        await user.click(screen.getByRole('checkbox', { name: 'Visual' }))
        await user.click(screen.getByRole('button', { name: 'Crear metodología' }))
        expect(screen.getByText(/al menos dos/)).toBeInTheDocument()
        expect(calls.some((c) => c.method === 'POST')).toBe(false)

        await user.click(screen.getByRole('checkbox', { name: 'Colaborativa' }))
        await user.click(screen.getByRole('button', { name: 'Crear metodología' }))

        await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/metodologias\/64a/))
        expect(lastCall(calls, 'POST', '/methodologies').body).toEqual({
            name: 'Rincón de lectura',
            description: 'Espacio para leer en grupos.',
            objectives: ['Fomentar la lectura'],
            steps: [{ title: 'Leer', description: 'Leer en voz alta' }, { description: 'Formar grupos' }],
            suggestedActivities: [],
            materials: ['Libros'],
            estimatedDuration: { minMinutes: 30, maxMinutes: 40 },
            compatibleGrades: [G1.id],
            compatibleSubjects: [],
            learningPreferences: ['visual', 'colaborativa'],
            sourceReference: null
        })
        expect(await screen.findByText('Se creó la metodología "Rincón de lectura".')).toBeInTheDocument()
        expect(await screen.findByRole('heading', { name: 'Rincón de lectura', level: 1 })).toBeInTheDocument()
        expect(screen.getByText('Personalizada')).toBeInTheDocument()
    })

    it('editar envía solo lo que cambió', async () => {
        const m = customMethod({ name: 'Mi estrategia' })
        const { calls } = createMethodologyBackend({ methods: [m] })
        renderRoute(`/metodologias/${m.id}/editar`)
        const user = u()
        const name = await screen.findByLabelText(/^nombre/i)
        expect(name).toHaveValue('Mi estrategia')

        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
        expect(screen.getByText('No hay cambios para guardar.')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Quitar material 4' }))
        await user.clear(name)
        await user.type(name, 'Mi estrategia 2')
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

        expect(await screen.findByText('Se guardaron los cambios de "Mi estrategia 2".')).toBeInTheDocument()
        expect(lastCall(calls, 'PATCH', '/methodologies/').body).toEqual({ name: 'Mi estrategia 2', materials: ['Tarjetas', 'Pizarrón', 'Marcadores'] })
    })

    it('los errores del backend en un paso aparecen en la sección de pasos', async () => {
        createMethodologyBackend({
            overrides: { 'POST /methodologies': () => fail(400, 'Errores de validación', [{ field: 'steps[0].description', message: 'La descripción del paso es obligatorio' }]) }
        })
        renderRoute('/metodologias/nueva')
        const user = u()
        await user.type(await screen.findByLabelText(/^nombre/i), 'X')
        await user.type(screen.getByLabelText(/^descripción/i), 'Y')
        await user.click(screen.getByRole('button', { name: 'Crear metodología' }))
        expect(await screen.findByText('La descripción del paso es obligatorio')).toBeInTheDocument()
    })

    it('crear una propia basada en una predeterminada cita su origen', async () => {
        const m = defaultMethod({ name: 'Diálogo de prueba' })
        const { calls } = createMethodologyBackend({ methods: [m] })
        renderRoute(`/metodologias/nueva?basadaEn=${m.id}`)
        const user = u()
        expect(await screen.findByLabelText(/^nombre/i)).toHaveValue('Diálogo de prueba (mi adaptación)')
        expect(screen.getByLabelText('Notas')).toHaveValue('Adaptación personal de la metodología predeterminada «Diálogo de prueba».')
        await user.click(screen.getByRole('button', { name: 'Crear metodología' }))
        await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true))
        const body = lastCall(calls, 'POST', '/methodologies').body
        expect(body.sourceReference).toMatchObject({ title: 'Documento de prueba', url: 'https://example.org/doc.pdf' })
        expect(body).not.toHaveProperty('isDefault')
        expect(body).not.toHaveProperty('defaultKey')
    })

    it('archivar una propia pide confirmación y quita la selección si estaba elegida', async () => {
        const m = customMethod({ name: 'Mi estrategia' })
        const { calls } = createMethodologyBackend({ methods: [m] })
        const { router } = renderRoute(`/metodologias/${m.id}`)
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Usar en mi próxima guía' }))
        await user.click(screen.getByRole('button', { name: 'Archivar' }))
        const dialog = await screen.findByRole('alertdialog')
        await user.click(within(dialog).getByRole('button', { name: 'Archivar' }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/metodologias'))
        expect(calls.some((c) => c.method === 'DELETE')).toBe(true)
        expect(window.sessionStorage.getItem('etamanik.guidePlanning')).toBeNull()
        expect(await screen.findByText('Se archivó la metodología "Mi estrategia".')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Mi estrategia' })).not.toBeInTheDocument()
    })
})
