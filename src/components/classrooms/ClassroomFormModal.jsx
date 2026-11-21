import { useRef, useState } from 'react'
import {
    Button,
    Checkbox,
    CheckboxGroup,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Stack,
    Text
} from '@chakra-ui/react'
import { FormField } from '../ui/FormField.jsx'
import { FormAlert } from '../ui/FormAlert.jsx'
import { LoadingState } from '../feedback/LoadingState.jsx'
import { ErrorState } from '../feedback/ErrorState.jsx'
import { useFormState } from '../../hooks/useFormState.js'
import { useQuery } from '../../hooks/useQuery.js'
import { getGrades, getSubjects } from '../../services/catalog.service.js'
import { createClassroom, updateClassroom } from '../../services/classroom.service.js'
import {
    CLASSROOM_NAME_MAX,
    SECTION_MAX,
    currentSchoolYear,
    validateClassroomName,
    validateGradeId,
    validateSchoolYear,
    validateSection,
    validateSubjectIds
} from '../../utils/classroom.js'

const toFormValues = (classroom) => ({
    name: classroom?.name ?? '',
    gradeId: classroom?.gradeId ?? classroom?.grade?.id ?? '',
    section: classroom?.section ?? '',
    schoolYear: String(classroom?.schoolYear ?? currentSchoolYear()),
    subjectIds: [...(classroom?.subjectIds ?? classroom?.subjects?.map((s) => s.id) ?? [])].map(String)
})

/** Datos listos para el backend (mismos nombres de campo del contrato B4). */
const toPayload = (values) => ({
    name: values.name.trim(),
    gradeId: values.gradeId,
    section: values.section.trim().toUpperCase(),
    schoolYear: Number(values.schoolYear),
    subjectIds: values.subjectIds
})

const sameSet = (a, b) => a.length === b.length && a.every((item) => b.includes(item))

/** Solo los campos que cambiaron respecto del aula original. */
const diff = (classroom, payload) => {
    const original = toPayload(toFormValues(classroom))
    const changes = {}
    for (const field of ['name', 'gradeId', 'section', 'schoolYear']) {
        if (payload[field] !== original[field]) changes[field] = payload[field]
    }
    if (!sameSet(payload.subjectIds, original.subjectIds)) changes.subjectIds = payload.subjectIds
    return changes
}

/** Materias del grado elegido (catálogo B3), como casillas. */
const SubjectsField = ({ gradeId, value, onChange, error }) => {
    const subjects = useQuery(gradeId || null, () => getSubjects({ grade: gradeId }))
    const list = subjects.data?.subjects ?? []

    return (
        <FormControl as="fieldset" isInvalid={Boolean(error)}>
            <FormLabel as="legend" id="subjectIds">
                Materias
            </FormLabel>
            {!gradeId && <Text fontSize="sm">Primero selecciona un grado para ver sus materias.</Text>}
            {subjects.isLoading && <LoadingState message="Cargando materias…" minH="80px" />}
            {subjects.isError && <ErrorState title="No se pudieron cargar las materias" error={subjects.error} onRetry={subjects.run} />}
            {subjects.isSuccess && list.length === 0 && (
                <Text fontSize="sm" bg="bg.surfaceMuted" px={3} py={2} borderRadius="md">
                    El catálogo no tiene materias registradas para este grado. Puedes crear el aula sin materias y agregarlas después.
                </Text>
            )}
            {subjects.isSuccess && list.length > 0 && (
                <CheckboxGroup value={value} onChange={(ids) => onChange(ids.map(String))}>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} bg="bg.input" p={3} borderRadius="md" borderWidth="2px" borderColor="border.subtle">
                        {list.map((subject) => (
                            <Checkbox key={subject.id} value={subject.id}>
                                {subject.name}
                            </Checkbox>
                        ))}
                    </SimpleGrid>
                </CheckboxGroup>
            )}
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : <FormHelperText fontSize="sm">Opcional. Solo se muestran las materias que se imparten en el grado elegido.</FormHelperText>}
        </FormControl>
    )
}

const ClassroomForm = ({ classroom, onClose, onSaved, nameRef }) => {
    const isEdit = Boolean(classroom)
    const form = useFormState(toFormValues(classroom))
    const [isSaving, setSaving] = useState(false)
    const [info, setInfo] = useState(null)
    const grades = useQuery('grades', () => getGrades())
    const { values } = form

    const changeGrade = (event) => {
        form.setValue('gradeId', event.target.value)
        // Las materias dependen del grado: se limpian para no enviar materias de otro grado
        form.setValue('subjectIds', [])
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setInfo(null)
        const valid = form.validate({
            name: validateClassroomName(values.name),
            gradeId: validateGradeId(values.gradeId),
            section: validateSection(values.section),
            schoolYear: validateSchoolYear(values.schoolYear),
            subjectIds: validateSubjectIds(values.subjectIds)
        })
        if (!valid) return

        const payload = toPayload(values)
        const changes = isEdit ? diff(classroom, payload) : payload
        if (isEdit && !Object.keys(changes).length) {
            setInfo('No hay cambios para guardar.')
            return
        }

        setSaving(true)
        try {
            const saved = isEdit ? await updateClassroom(classroom.id, changes) : await createClassroom(payload)
            onSaved(saved)
        } catch (error) {
            form.applyServerError(error)
            setSaving(false)
        }
    }

    return (
        <ModalContent as="form" onSubmit={handleSubmit} noValidate>
            <ModalHeader>{isEdit ? 'Editar aula' : 'Nueva aula'}</ModalHeader>
            <ModalCloseButton aria-label="Cerrar" isDisabled={isSaving} />
            <ModalBody>
                <Stack spacing={5}>
                    {info && <FormAlert status="info">{info}</FormAlert>}
                    <FormAlert>{form.formError}</FormAlert>

                    <FormField id="name" label="Nombre del aula" error={form.errors.name} helper="Ej.: Tercero A matutina" isRequired>
                        <Input ref={nameRef} maxLength={CLASSROOM_NAME_MAX} {...form.field('name')} />
                    </FormField>

                    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                        <FormField id="gradeId" label="Grado" error={form.errors.gradeId} isRequired>
                            {grades.isError ? (
                                <ErrorState title="No se pudieron cargar los grados" error={grades.error} onRetry={grades.run} />
                            ) : (
                                <Select placeholder={grades.isLoading ? 'Cargando…' : 'Selecciona'} value={values.gradeId} onChange={changeGrade} isDisabled={!grades.isSuccess}>
                                    {(grades.data ?? []).map((grade) => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </FormField>
                        <FormField id="section" label="Sección" error={form.errors.section} helper="Ej.: A" isRequired>
                            <Input maxLength={SECTION_MAX} textTransform="uppercase" {...form.field('section')} />
                        </FormField>
                        <FormField id="schoolYear" label="Ciclo escolar" error={form.errors.schoolYear} isRequired>
                            <Input type="number" inputMode="numeric" min={2000} max={2100} {...form.field('schoolYear')} />
                        </FormField>
                    </SimpleGrid>

                    {grades.isSuccess && grades.data.length === 0 && (
                        <FormAlert status="warning">El catálogo curricular aún no tiene grados: no se pueden crear aulas todavía.</FormAlert>
                    )}

                    <SubjectsField
                        gradeId={values.gradeId}
                        value={values.subjectIds}
                        onChange={(ids) => form.setValue('subjectIds', ids)}
                        error={form.errors.subjectIds}
                    />
                </Stack>
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onClose} isDisabled={isSaving}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={isSaving} loadingText="Guardando…">
                    {isEdit ? 'Guardar cambios' : 'Crear aula'}
                </Button>
            </ModalFooter>
        </ModalContent>
    )
}

/**
 * Crear o editar un aula: nombre, grado, sección, ciclo escolar y materias.
 * Sin `classroom` crea; con `classroom` edita y envía solo lo que cambió.
 */
export const ClassroomFormModal = ({ isOpen, onClose, classroom = null, onSaved }) => {
    const nameRef = useRef(null)
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" closeOnOverlayClick={false} initialFocusRef={nameRef}>
            <ModalOverlay />
            {/* El contenido se monta al abrir: el formulario empieza con los datos del aula elegida */}
            {isOpen && <ClassroomForm key={classroom?.id ?? 'new'} classroom={classroom} onClose={onClose} onSaved={onSaved} nameRef={nameRef} />}
        </Modal>
    )
}
