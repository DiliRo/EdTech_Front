import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './renderWithProviders.jsx'
import { fail } from './mockApi.js'
import { createBackend, classroom, student, G1, G2, S1, S2, S3 } from './classroomBackend.js'

const u = () => userEvent.setup()
const dialog = () => screen.findByRole('dialog')
const lastCall = (calls, method, urlStart) => [...calls].reverse().find((c) => c.method === method && c.url.startsWith(urlStart))

describe('Listado de aulas', () => {
    it('muestra las aulas activas del docente con grado, sección, ciclo, materias y estudiantes', async () => {
        const a = classroom({ name: 'Primero A' })
        createBackend({ classrooms: [a, classroom({ name: 'Vieja', isActive: false })], students: [student(a.id, 'A01'), student(a.id, 'A02')] })
        renderRoute('/aulas')

        const card = (await screen.findByRole('link', { name: 'Primero A' })).closest('.chakra-card')
        expect(card).toHaveTextContent('Primer grado · Sección A')
        expect(card).toHaveTextContent('Ciclo 2026')
        expect(card).toHaveTextContent('2 estudiantes activos')
        expect(card).toHaveTextContent('Materia A')
        expect(screen.queryByText('Vieja')).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Primero A' })).toHaveAttribute('href', `/aulas/${a.id}`)
    })

    it('sin aulas: estado vacío con acción para crear la primera', async () => {
        createBackend()
        renderRoute('/aulas')
        expect(await screen.findByText('Aún no tienes aulas activas')).toBeInTheDocument()
        await u().click(screen.getByRole('button', { name: 'Crear aula' }))
        expect(await dialog()).toHaveTextContent('Nueva aula')
    })

    it('busca, filtra por ciclo y pagina de 9 en 9', async () => {
        const many = Array.from({ length: 11 }, (_, i) => classroom({ name: `Aula ${String(i + 1).padStart(2, '0')}`, schoolYear: i < 10 ? 2026 : 2025 }))
        createBackend({ classrooms: many })
        renderRoute('/aulas')
        const user = u()

        expect(await screen.findByText('Mostrando 1–9 de 11 aulas')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Página 2' }))
        expect(screen.getByText('Mostrando 10–11 de 11 aulas')).toBeInTheDocument()

        await user.selectOptions(screen.getByLabelText('Ciclo escolar'), '2025')
        expect(screen.getByText('Mostrando 1–1 de 1 aulas')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Aula 11' })).toBeInTheDocument()

        await user.selectOptions(screen.getByLabelText('Ciclo escolar'), '')
        await user.type(screen.getByLabelText('Buscar aula'), 'aula 03')
        expect(screen.getByRole('link', { name: 'Aula 03' })).toBeInTheDocument()

        await user.clear(screen.getByLabelText('Buscar aula'))
        await user.type(screen.getByLabelText('Buscar aula'), 'zzz')
        expect(screen.getByText('Ninguna aula coincide con tu búsqueda')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
        expect(screen.getByText('Mostrando 1–9 de 11 aulas')).toBeInTheDocument()
    })
})

describe('Crear y editar aulas', () => {
    it('valida, muestra solo las materias del grado y crea el aula; la lista se actualiza', async () => {
        const { calls } = createBackend()
        renderRoute('/aulas')
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Nueva aula' }))
        const modal = await dialog()

        await user.click(within(modal).getByRole('button', { name: 'Crear aula' }))
        expect(within(modal).getByText('El nombre del aula es obligatorio')).toBeInTheDocument()
        expect(within(modal).getByText('Selecciona un grado')).toBeInTheDocument()
        expect(within(modal).getByText('La sección es obligatoria')).toBeInTheDocument()
        expect(calls.some((c) => c.method === 'POST')).toBe(false)

        await user.type(within(modal).getByLabelText(/nombre del aula/i), 'Segundo B')
        await waitFor(() => expect(within(modal).getByLabelText(/^grado/i)).toBeEnabled())
        await user.selectOptions(within(modal).getByLabelText(/^grado/i), G2.id)
        expect(await within(modal).findByRole('checkbox', { name: 'Materia C' })).toBeInTheDocument()
        expect(within(modal).queryByRole('checkbox', { name: 'Materia B' })).not.toBeInTheDocument() // solo se imparte en 1.º
        await user.click(within(modal).getByRole('checkbox', { name: 'Materia C' }))
        await user.type(within(modal).getByLabelText(/^sección/i), 'b')
        const year = within(modal).getByLabelText(/ciclo escolar/i)
        await user.clear(year)
        await user.type(year, '2027')
        await user.click(within(modal).getByRole('button', { name: 'Crear aula' }))

        expect(await screen.findByText('Se creó el aula "Segundo B".')).toBeInTheDocument()
        expect(lastCall(calls, 'POST', '/classrooms').body).toEqual({ name: 'Segundo B', gradeId: G2.id, section: 'B', schoolYear: 2027, subjectIds: [S3.id] })
        expect(await screen.findByRole('link', { name: 'Segundo B' })).toBeInTheDocument()
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('al cambiar de grado se limpian las materias elegidas', async () => {
        createBackend()
        renderRoute('/aulas')
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Nueva aula' }))
        const modal = await dialog()
        await waitFor(() => expect(within(modal).getByLabelText(/^grado/i)).toBeEnabled())
        await user.selectOptions(within(modal).getByLabelText(/^grado/i), G1.id)
        await user.click(await within(modal).findByRole('checkbox', { name: 'Materia A' }))
        await user.selectOptions(within(modal).getByLabelText(/^grado/i), G2.id)
        expect(await within(modal).findByRole('checkbox', { name: 'Materia A' })).not.toBeChecked()
    })

    it('editar envía solo los campos que cambiaron', async () => {
        const a = classroom({ name: 'Primero A', subjectIds: [S1.id] })
        const { calls } = createBackend({ classrooms: [a] })
        renderRoute('/aulas')
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Editar' }))
        const modal = await dialog()
        expect(within(modal).getByLabelText(/nombre del aula/i)).toHaveValue('Primero A')
        expect(await within(modal).findByRole('checkbox', { name: 'Materia A' })).toBeChecked()

        await user.click(within(modal).getByRole('button', { name: 'Guardar cambios' }))
        expect(within(modal).getByText('No hay cambios para guardar.')).toBeInTheDocument()

        await user.click(within(modal).getByRole('checkbox', { name: 'Materia B' }))
        await user.clear(within(modal).getByLabelText(/^sección/i))
        await user.type(within(modal).getByLabelText(/^sección/i), 'C')
        await user.click(within(modal).getByRole('button', { name: 'Guardar cambios' }))

        expect(await screen.findByText('Se guardaron los cambios de "Primero A".')).toBeInTheDocument()
        expect(lastCall(calls, 'PATCH', '/classrooms').body).toEqual({ section: 'C', subjectIds: [S1.id, S2.id] })
        expect(await screen.findByText('Primer grado · Sección C')).toBeInTheDocument()
    })

    it('muestra en el campo de materias el error que devuelve el backend', async () => {
        createBackend({
            overrides: { 'POST /classrooms': () => fail(400, 'Errores de validación', [{ field: 'subjectIds[0]', message: '"Materia A" no se imparte en Primer grado' }]) }
        })
        renderRoute('/aulas')
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Nueva aula' }))
        const modal = await dialog()
        await user.type(within(modal).getByLabelText(/nombre del aula/i), 'X')
        await waitFor(() => expect(within(modal).getByLabelText(/^grado/i)).toBeEnabled())
        await user.selectOptions(within(modal).getByLabelText(/^grado/i), G1.id)
        await user.click(await within(modal).findByRole('checkbox', { name: 'Materia A' }))
        await user.type(within(modal).getByLabelText(/^sección/i), 'A')
        await user.click(within(modal).getByRole('button', { name: 'Crear aula' }))
        expect(await within(modal).findByText('"Materia A" no se imparte en Primer grado')).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
})

describe('Archivar y restaurar aulas', () => {
    it('pide confirmación; cancelar no archiva y confirmar actualiza la lista', async () => {
        const a = classroom({ name: 'Primero A' })
        const { calls } = createBackend({ classrooms: [a] })
        renderRoute('/aulas')
        const user = u()

        await user.click(await screen.findByRole('button', { name: 'Archivar' }))
        let alert = await screen.findByRole('alertdialog')
        expect(alert).toHaveTextContent('¿Archivar esta aula?')
        expect(alert).toHaveTextContent('Primero A')
        await user.click(within(alert).getByRole('button', { name: 'Cancelar' }))
        expect(calls.some((c) => c.method === 'DELETE')).toBe(false)

        await user.click(screen.getByRole('button', { name: 'Archivar' }))
        alert = await screen.findByRole('alertdialog')
        await user.click(within(alert).getByRole('button', { name: 'Archivar aula' }))
        expect(await screen.findByText('Se archivó el aula "Primero A".')).toBeInTheDocument()
        expect(await screen.findByText('Aún no tienes aulas activas')).toBeInTheDocument()

        await user.click(screen.getByRole('radio', { name: 'Archivadas' }))
        expect(await screen.findByRole('link', { name: 'Primero A' })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Restaurar' }))
        expect(await screen.findByText('Se restauró el aula "Primero A".')).toBeInTheDocument()
        expect(await screen.findByText('No tienes aulas archivadas')).toBeInTheDocument()
    })

    it('si archivar falla, el error se muestra en el diálogo', async () => {
        createBackend({ classrooms: [classroom()], overrides: { 'DELETE /classrooms/:id': () => fail(500, 'Ocurrió un error en el servidor') } })
        renderRoute('/aulas')
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Archivar' }))
        const alert = await screen.findByRole('alertdialog')
        await user.click(within(alert).getByRole('button', { name: 'Archivar aula' }))
        expect(await within(alert).findByText('Ocurrió un error en el servidor')).toBeInTheDocument()
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
})

describe('Detalle del aula y estudiantes', () => {
    const setup = (students = [], classroomOverrides = {}) => {
        const a = classroom({ name: 'Primero A', ...classroomOverrides })
        const backend = createBackend({ classrooms: [a], students: students.map((code) => student(a.id, code)) })
        const view = renderRoute(`/aulas/${a.id}`)
        return { a, ...backend, ...view }
    }

    it('muestra la información general y la tabla de estudiantes por código', async () => {
        setup(['B02', 'A01'])
        expect(await screen.findByRole('heading', { name: 'Primero A', level: 1 })).toBeInTheDocument()
        expect(screen.getByText('Primer grado · Sección A · Ciclo 2026')).toBeInTheDocument()
        const table = await screen.findByRole('table')
        const rows = within(table).getAllByRole('row').slice(1)
        expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual(['A01', 'B02'])
        expect(screen.getByText('Mostrando 1–2 de 2 estudiantes')).toBeInTheDocument()
    })

    it('agrega un estudiante pidiendo SOLO el código; se envía en mayúsculas y la tabla se actualiza', async () => {
        const { calls } = setup()
        const user = u()
        expect(await screen.findByText('Esta aula aún no tiene estudiantes activos')).toBeInTheDocument()
        await user.click(screen.getAllByRole('button', { name: 'Agregar estudiante' })[0])
        const modal = await dialog()

        expect(within(modal).getAllByRole('textbox')).toHaveLength(1)
        expect(within(modal).queryByLabelText(/nombre|apellido|correo|contraseña/i)).not.toBeInTheDocument()

        await user.type(within(modal).getByLabelText(/código del estudiante/i), ' a01 ')
        await user.click(within(modal).getByRole('button', { name: 'Agregar' }))

        expect(await screen.findByText('Se agregó al estudiante A01.')).toBeInTheDocument()
        expect(lastCall(calls, 'POST', '/classrooms/').body).toEqual({ studentCode: 'A01' })
        expect(await within(await screen.findByRole('table')).findByText('A01')).toBeInTheDocument()
        // El conteo del aula también se actualiza
        await waitFor(() => expect(screen.getByText('Estudiantes activos').nextSibling).toHaveTextContent('1'))
    })

    it('"Agregar y continuar" deja el formulario listo para el siguiente código', async () => {
        const { calls } = setup()
        const user = u()
        await user.click((await screen.findAllByRole('button', { name: 'Agregar estudiante' }))[0])
        const modal = await dialog()
        const input = within(modal).getByLabelText(/código del estudiante/i)
        await user.type(input, 'A01')
        await user.click(within(modal).getByRole('button', { name: 'Agregar y continuar' }))
        expect(await within(modal).findByText('Se agregó el código A01.')).toBeInTheDocument()
        expect(input).toHaveValue('')
        await user.type(input, 'A02')
        await user.click(within(modal).getByRole('button', { name: 'Agregar y continuar' }))
        expect(await within(modal).findByText('Se agregó el código A02.')).toBeInTheDocument()
        expect(calls.filter((c) => c.method === 'POST').map((c) => c.body.studentCode)).toEqual(['A01', 'A02'])
    })

    it('valida el formato del código y muestra el error de código repetido', async () => {
        setup(['A01'])
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Agregar estudiante' }))
        const modal = await dialog()
        const input = within(modal).getByLabelText(/código del estudiante/i)

        await user.type(input, 'Ana López')
        await user.click(within(modal).getByRole('button', { name: 'Agregar' }))
        expect(within(modal).getByText(/Usa letras sin tilde/)).toBeInTheDocument()

        await user.clear(input)
        await user.type(input, 'a01')
        await user.click(within(modal).getByRole('button', { name: 'Agregar' }))
        expect(await within(modal).findByText('El código ya está en uso en esta aula (también cuenta a los archivados)')).toBeInTheDocument()
        expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('edita el código de un estudiante', async () => {
        const { calls } = setup(['A01'])
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Editar código A01' }))
        const modal = await dialog()
        const input = within(modal).getByLabelText(/código del estudiante/i)
        expect(input).toHaveValue('A01')
        await user.clear(input)
        await user.type(input, 'MAT-01')
        await user.click(within(modal).getByRole('button', { name: 'Guardar código' }))
        expect(await screen.findByText('El código se cambió a MAT-01.')).toBeInTheDocument()
        expect(lastCall(calls, 'PATCH', '/students/').body).toEqual({ studentCode: 'MAT-01' })
        expect(await within(screen.getByRole('table')).findByText('MAT-01')).toBeInTheDocument()
    })

    it('retira con confirmación y permite reincorporar desde "Retirados"', async () => {
        const { calls } = setup(['A01', 'A02'])
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Retirar a A01' }))
        const alert = await screen.findByRole('alertdialog')
        expect(alert).toHaveTextContent('A01')
        expect(alert).toHaveTextContent('su historial se conserva')
        await user.click(within(alert).getByRole('button', { name: 'Retirar estudiante' }))

        expect(await screen.findByText('Se retiró al estudiante A01.')).toBeInTheDocument()
        expect(calls.some((c) => c.method === 'DELETE' && c.url.startsWith('/students/'))).toBe(true)
        await waitFor(() => expect(within(screen.getByRole('table')).queryByText('A01')).not.toBeInTheDocument())

        await user.click(screen.getByRole('radio', { name: 'Retirados' }))
        await user.click(await screen.findByRole('button', { name: 'Reincorporar a A01' }))
        expect(await screen.findByText('Se reincorporó al estudiante A01.')).toBeInTheDocument()
        expect(await screen.findByText('No hay estudiantes retirados')).toBeInTheDocument()
    })

    it('busca por código y pagina de 20 en 20', async () => {
        setup(Array.from({ length: 25 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`))
        const user = u()
        expect(await screen.findByText('Mostrando 1–20 de 25 estudiantes')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
        expect(screen.getByText('Mostrando 21–25 de 25 estudiantes')).toBeInTheDocument()
        await user.type(screen.getByLabelText('Buscar por código'), 'e07')
        expect(screen.getByText('Mostrando 1–1 de 1 estudiantes')).toBeInTheDocument()
        await user.clear(screen.getByLabelText('Buscar por código'))
        await user.type(screen.getByLabelText('Buscar por código'), 'X99')
        expect(screen.getByText('Ningún código coincide con tu búsqueda')).toBeInTheDocument()
    })

    it('aula archivada: aviso, sin agregar estudiantes y con opción de restaurar', async () => {
        setup(['A01'], { isActive: false })
        expect(await screen.findByText(/Esta aula está archivada/)).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Agregar estudiante' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Editar aula' })).not.toBeInTheDocument()
        await u().click(screen.getByRole('button', { name: 'Restaurar aula' }))
        expect(await screen.findByRole('button', { name: 'Editar aula' })).toBeInTheDocument()
    })

    it('archivar desde el detalle pide confirmación', async () => {
        setup()
        const user = u()
        await user.click(await screen.findByRole('button', { name: 'Archivar' }))
        await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Archivar aula' }))
        expect(await screen.findByText(/Esta aula está archivada/)).toBeInTheDocument()
    })

    it('un aula inexistente o de otro docente (404) no muestra datos', async () => {
        const { calls } = createBackend()
        renderRoute('/aulas/64e0000000000000000000ff')
        expect(await screen.findByText('Aula no encontrada')).toBeInTheDocument()
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
        expect(calls.some((c) => c.url.endsWith('/students'))).toBe(false)
    })

    it('desde la lista se abre el detalle del aula', async () => {
        const a = classroom({ name: 'Primero A' })
        createBackend({ classrooms: [a] })
        const { router } = renderRoute('/aulas')
        await u().click(await screen.findByRole('link', { name: 'Primero A' }))
        await waitFor(() => expect(router.state.location.pathname).toBe(`/aulas/${a.id}`))
        expect(await screen.findByRole('heading', { name: 'Información general' })).toBeInTheDocument()
    })
})
