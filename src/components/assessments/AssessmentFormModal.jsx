import { useRef, useState } from 'react'
import {
    Button,
    Input,
    InputGroup,
    InputLeftAddon,
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
import { useFormState } from '../../hooks/useFormState.js'
import { useQuery } from '../../hooks/useQuery.js'
import { useGuidePlanning } from '../../hooks/useGuidePlanning.js'
import { getAllTopics, getSubjects } from '../../services/catalog.service.js'
import { listMethodologies } from '../../services/methodology.service.js'
import { createAssessment } from '../../services/assessment.service.js'
import { ASSESSMENT_TYPES, MAX_SCORE_LIMIT, TITLE_MAX, todayISO, validateMaxScore } from '../../utils/assessment.js'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Materias que acepta el backend para el aula: las asignadas al aula o, si no tiene, las que
 * se imparten en su grado (misma regla de B6).
 */
const useClassroomSubjects = (classroom) => {
    const own = classroom.subjects ?? []
    const fromGrade = useQuery(own.length ? null : `subjects:${classroom.gradeId}`, () => getSubjects({ grade: classroom.gradeId }))
    if (own.length) return { status: 'success', list: own }
    return { status: fromGrade.status, list: fromGrade.data?.subjects ?? [], run: fromGrade.run }
}

const AssessmentForm = ({ classroom, onClose, onCreated, titleRef }) => {
    const { selectedMethodology } = useGuidePlanning()
    const form = useFormState({
        title: '',
        subjectId: '',
        topicId: '',
        teachingMethodId: '',
        assessmentDate: todayISO(),
        maxScore: '',
        assessmentType: ''
    })
    const [isSaving, setSaving] = useState(false)
    const { values } = form
    const subjects = useClassroomSubjects(classroom)

    const topics = useQuery(values.subjectId ? `topics:${classroom.gradeId}:${values.subjectId}` : null, () =>
        getAllTopics({ grade: classroom.gradeId, subject: values.subjectId })
    )
    const methods = useQuery(`methods:${classroom.gradeId}:${values.subjectId}`, () =>
        listMethodologies({ grade: classroom.gradeId, subject: values.subjectId || undefined })
    )
    const methodList = methods.data?.methodologies ?? []
    const suggested = selectedMethodology && methodList.some((m) => m.id === selectedMethodology.id) ? selectedMethodology : null

    const changeSubject = (event) => {
        form.setValue('subjectId', event.target.value)
        form.setValue('topicId', '') // el tema depende de la materia
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const valid = form.validate({
            title: !values.title.trim() ? 'El título es obligatorio' : values.title.trim().length > TITLE_MAX ? `Máximo ${TITLE_MAX} caracteres` : null,
            subjectId: values.subjectId ? null : 'Selecciona una materia',
            assessmentDate: DATE_REGEX.test(values.assessmentDate) ? null : 'Indica la fecha de la evaluación',
            maxScore: validateMaxScore(values.maxScore),
            assessmentType: values.assessmentType ? null : 'Selecciona el tipo de evaluación'
        })
        if (!valid) return

        setSaving(true)
        try {
            const created = await createAssessment({
                title: values.title.trim(),
                classroomId: classroom.id,
                subjectId: values.subjectId,
                topicId: values.topicId || undefined,
                teachingMethodId: values.teachingMethodId || undefined,
                assessmentDate: values.assessmentDate,
                maxScore: Number(String(values.maxScore).replace(',', '.')),
                assessmentType: values.assessmentType
            })
            onCreated(created)
        } catch (error) {
            form.applyServerError(error)
            setSaving(false)
        }
    }

    return (
        <ModalContent as="form" onSubmit={handleSubmit} noValidate>
            <ModalHeader>Nueva evaluación</ModalHeader>
            <ModalCloseButton aria-label="Cerrar" isDisabled={isSaving} />
            <ModalBody>
                <Stack spacing={5}>
                    <Text fontSize="sm">
                        Aula: <strong>{classroom.name}</strong>
                    </Text>
                    <FormAlert>{form.formError}</FormAlert>

                    <FormField id="title" label="Título" error={form.errors.title} helper="Ej.: Prueba corta de fracciones" isRequired>
                        <Input ref={titleRef} maxLength={TITLE_MAX} {...form.field('title')} />
                    </FormField>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormField id="subjectId" label="Materia" error={form.errors.subjectId} isRequired>
                            <Select placeholder={subjects.status === 'loading' ? 'Cargando…' : 'Selecciona'} value={values.subjectId} onChange={changeSubject} isDisabled={subjects.status !== 'success'}>
                                {subjects.list.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField
                            id="topicId"
                            label="Tema"
                            error={form.errors.topicId}
                            helper={
                                !values.subjectId
                                    ? 'Opcional. Primero elige la materia.'
                                    : topics.isSuccess && topics.data.topics.length === 0
                                      ? 'El catálogo no tiene temas de esta materia para el grado.'
                                      : 'Opcional.'
                            }
                        >
                            <Select value={values.topicId} onChange={(e) => form.setValue('topicId', e.target.value)} isDisabled={!values.subjectId || !topics.isSuccess}>
                                <option value="">Sin tema</option>
                                {(topics.data?.topics ?? []).map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    </SimpleGrid>
                    {subjects.status === 'success' && subjects.list.length === 0 && (
                        <FormAlert status="warning">El aula no tiene materias y el catálogo no registra materias para su grado.</FormAlert>
                    )}
                    {subjects.status === 'error' && <FormAlert>No se pudieron cargar las materias.</FormAlert>}

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <FormField id="assessmentDate" label="Fecha" error={form.errors.assessmentDate} isRequired>
                            <Input type="date" {...form.field('assessmentDate')} />
                        </FormField>
                        <FormField id="maxScore" label="Puntuación máxima" error={form.errors.maxScore} helper="No se puede cambiar después." isRequired>
                            <InputGroup>
                                <InputLeftAddon bg="bg.surfaceMuted" color="text.primary" borderColor="border.subtle">
                                    0 a
                                </InputLeftAddon>
                                <Input type="text" inputMode="decimal" placeholder={`máx. ${MAX_SCORE_LIMIT}`} {...form.field('maxScore')} />
                            </InputGroup>
                        </FormField>
                        <FormField id="assessmentType" label="Tipo" error={form.errors.assessmentType} isRequired>
                            <Select placeholder="Selecciona" {...form.field('assessmentType')}>
                                {ASSESSMENT_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    </SimpleGrid>

                    <FormField
                        id="teachingMethodId"
                        label="Metodología"
                        error={form.errors.teachingMethodId}
                        helper={
                            suggested && values.teachingMethodId !== suggested.id
                                ? `Opcional. Tienes elegida "${suggested.name}" para tu próxima guía.`
                                : 'Opcional. Permite comparar después cómo funcionó cada estrategia.'
                        }
                    >
                        <Select value={values.teachingMethodId} onChange={(e) => form.setValue('teachingMethodId', e.target.value)} isDisabled={methods.isLoading}>
                            <option value="">Sin metodología</option>
                            {methodList.map((method) => (
                                <option key={method.id} value={method.id}>
                                    {method.name}
                                    {method.isDefault ? ' (predeterminada)' : ' (personalizada)'}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                </Stack>
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onClose} isDisabled={isSaving}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={isSaving} loadingText="Creando…">
                    Crear evaluación
                </Button>
            </ModalFooter>
        </ModalContent>
    )
}

/** Crear una evaluación en un aula: materia, tema, fecha, metodología, puntuación máxima y tipo. */
export const AssessmentFormModal = ({ isOpen, onClose, classroom, onCreated }) => {
    const titleRef = useRef(null)
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" closeOnOverlayClick={false} initialFocusRef={titleRef}>
            <ModalOverlay />
            {isOpen && <AssessmentForm classroom={classroom} onClose={onClose} onCreated={onCreated} titleRef={titleRef} />}
        </Modal>
    )
}
