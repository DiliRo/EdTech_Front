import { useState } from 'react'
import {
    Button,
    Checkbox,
    CheckboxGroup,
    Flex,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    Wrap,
    WrapItem
} from '@chakra-ui/react'
import { FiBookOpen, FiClock, FiFileText, FiList, FiUsers } from 'react-icons/fi'
import { SurfaceCard } from '../ui/SurfaceCard.jsx'
import { FormField } from '../ui/FormField.jsx'
import { FormAlert } from '../ui/FormAlert.jsx'
import { ItemListEditor, StringListEditor } from './ListEditor.jsx'
import { useFormState } from '../../hooks/useFormState.js'
import { useQuery } from '../../hooks/useQuery.js'
import { getGrades, getSubjects } from '../../services/catalog.service.js'
import { DURATION_RANGE, METHOD_LIMITS as L, diffMethodology, toMethodologyFormValues, toMethodologyPayload, validateMethodology } from '../../utils/methodology.js'

const CheckboxList = ({ id, label, helper, options, value, onChange, error, isLoading, loadError }) => (
    <FormControl as="fieldset" isInvalid={Boolean(error)}>
        <FormLabel as="legend" id={id}>
            {label}
        </FormLabel>
        {isLoading && <Text fontSize="sm">Cargando…</Text>}
        {loadError && <Text fontSize="sm" color="status.error">{loadError}</Text>}
        {!isLoading && !loadError && options.length === 0 && <Text fontSize="sm">No hay opciones disponibles en el catálogo.</Text>}
        {options.length > 0 && (
            <CheckboxGroup value={value} onChange={(ids) => onChange(ids.map(String))}>
                <Wrap spacing={4} bg="bg.input" p={3} borderRadius="md" borderWidth="2px" borderColor="border.subtle">
                    {options.map((option) => (
                        <WrapItem key={option.value}>
                            <Checkbox value={option.value}>{option.label}</Checkbox>
                        </WrapItem>
                    ))}
                </Wrap>
            </CheckboxGroup>
        )}
        {error ? <FormErrorMessage>{error}</FormErrorMessage> : helper && <FormHelperText fontSize="sm">{helper}</FormHelperText>}
    </FormControl>
)

/**
 * Formulario de una metodología personalizada (crear o editar).
 *
 * @param {object} props
 * @param {object|null} props.methodology   metodología a editar (null = nueva)
 * @param {object} [props.initialValues]    valores iniciales (p. ej. adaptación de una predeterminada)
 * @param {Array<{code,label}>} props.preferences   catálogo de preferencias del backend
 * @param {(payload: object, changes: object|null) => Promise<any>} props.onSubmit
 * @param {() => void} props.onCancel
 */
export const MethodologyForm = ({ methodology = null, initialValues, preferences, onSubmit, onCancel }) => {
    const isEdit = Boolean(methodology)
    const form = useFormState(initialValues ?? toMethodologyFormValues(methodology))
    const [isSaving, setSaving] = useState(false)
    const [info, setInfo] = useState(null)
    const grades = useQuery('grades', () => getGrades())
    const subjects = useQuery('subjects:all', () => getSubjects({}))
    const { values } = form
    const set = (name) => (value) => form.setValue(name, value)
    const setNested = (name, key) => (event) => form.setValue(name, { ...values[name], [key]: event.target.value })

    const handleSubmit = async (event) => {
        event.preventDefault()
        setInfo(null)
        if (!form.validate(validateMethodology(values))) return

        const payload = toMethodologyPayload(values)
        const changes = isEdit ? diffMethodology(toMethodologyPayload(toMethodologyFormValues(methodology)), payload) : null
        if (isEdit && !Object.keys(changes).length) {
            setInfo('No hay cambios para guardar.')
            return
        }

        setSaving(true)
        try {
            await onSubmit(payload, changes)
        } catch (error) {
            form.applyServerError(error)
            setSaving(false)
        }
    }

    return (
        <Stack as="form" spacing={6} onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Editar metodología' : 'Nueva metodología'}>
            {info && <FormAlert status="info">{info}</FormAlert>}
            <FormAlert>{form.formError}</FormAlert>

            <SurfaceCard title="Información básica" icon={FiFileText}>
                <Stack spacing={4}>
                    <FormField id="name" label="Nombre" error={form.errors.name} isRequired>
                        <Input maxLength={L.name} {...form.field('name')} />
                    </FormField>
                    <FormField id="description" label="Descripción" error={form.errors.description} helper="En qué consiste y cuándo la usas." isRequired>
                        <Textarea rows={4} maxLength={L.description} {...form.field('description')} />
                    </FormField>
                    <StringListEditor
                        id="objectives"
                        label="Objetivos"
                        noun="objetivo"
                        items={values.objectives}
                        onChange={set('objectives')}
                        error={form.errors.objectives}
                        addLabel="Agregar objetivo"
                        maxLength={L.item}
                    />
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Pasos y actividades" icon={FiList}>
                <Stack spacing={6}>
                    <ItemListEditor
                        id="steps"
                        label="Pasos"
                        noun="paso"
                        items={values.steps}
                        onChange={set('steps')}
                        error={form.errors.steps}
                        helper="El orden importa: usa las flechas para reordenar. El título es opcional."
                        addLabel="Agregar paso"
                        titleLabel="Título (opcional)"
                        descriptionLabel="Descripción"
                        titleMax={L.title}
                        descriptionMax={L.item}
                        ordered
                    />
                    <ItemListEditor
                        id="suggestedActivities"
                        label="Actividades sugeridas"
                        noun="actividad"
                        items={values.suggestedActivities}
                        onChange={set('suggestedActivities')}
                        error={form.errors.suggestedActivities}
                        addLabel="Agregar actividad"
                        titleLabel="Título"
                        descriptionLabel="Descripción (opcional)"
                        titleMax={L.title}
                        descriptionMax={L.item}
                    />
                    <StringListEditor
                        id="materials"
                        label="Materiales y recursos"
                        noun="material"
                        items={values.materials}
                        onChange={set('materials')}
                        error={form.errors.materials}
                        addLabel="Agregar material"
                        maxLength={L.title}
                    />
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Duración y compatibilidad" icon={FiClock}>
                <Stack spacing={5}>
                    <FormControl as="fieldset" isInvalid={Boolean(form.errors.estimatedDuration)}>
                        <FormLabel as="legend">Duración estimada (minutos)</FormLabel>
                        <SimpleGrid columns={2} spacing={3} maxW="sm">
                            <Input
                                id="estimatedDuration"
                                type="number"
                                inputMode="numeric"
                                min={DURATION_RANGE.min}
                                max={DURATION_RANGE.max}
                                aria-label="Duración mínima en minutos"
                                placeholder="Mínima"
                                value={values.estimatedDuration.min}
                                onChange={setNested('estimatedDuration', 'min')}
                            />
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={DURATION_RANGE.min}
                                max={DURATION_RANGE.max}
                                aria-label="Duración máxima en minutos"
                                placeholder="Máxima"
                                value={values.estimatedDuration.max}
                                onChange={setNested('estimatedDuration', 'max')}
                            />
                        </SimpleGrid>
                        {form.errors.estimatedDuration ? (
                            <FormErrorMessage>{form.errors.estimatedDuration}</FormErrorMessage>
                        ) : (
                            <FormHelperText fontSize="sm">Opcional, entre {DURATION_RANGE.min} y {DURATION_RANGE.max} minutos. Déjalo vacío si no aplica.</FormHelperText>
                        )}
                    </FormControl>

                    <CheckboxList
                        id="compatibleGrades"
                        label="Grados"
                        helper="Si no marcas ninguno, se considera aplicable a cualquier grado."
                        options={(grades.data ?? []).map((g) => ({ value: g.id, label: g.name }))}
                        value={values.compatibleGrades}
                        onChange={set('compatibleGrades')}
                        error={form.errors.compatibleGrades}
                        isLoading={grades.isLoading}
                        loadError={grades.isError ? 'No se pudieron cargar los grados.' : null}
                    />
                    <CheckboxList
                        id="compatibleSubjects"
                        label="Materias"
                        helper="Si no marcas ninguna, se considera aplicable a cualquier materia."
                        options={(subjects.data?.subjects ?? []).map((s) => ({ value: s.id, label: s.name }))}
                        value={values.compatibleSubjects}
                        onChange={set('compatibleSubjects')}
                        error={form.errors.compatibleSubjects}
                        isLoading={subjects.isLoading}
                        loadError={subjects.isError ? 'No se pudieron cargar las materias.' : null}
                    />
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Preferencias de aprendizaje" icon={FiUsers}>
                <CheckboxList
                    id="learningPreferences"
                    label="Preferencias que puede favorecer"
                    helper="Opcional. Si indicas preferencias, marca al menos dos: ninguna metodología es exclusiva de un estilo y las preferencias no determinan el rendimiento."
                    options={preferences.map((p) => ({ value: p.code, label: p.label }))}
                    value={values.learningPreferences}
                    onChange={set('learningPreferences')}
                    error={form.errors.learningPreferences}
                />
            </SurfaceCard>

            <SurfaceCard title="Fuente (opcional)" icon={FiBookOpen} description="Si te basaste en un documento, indícalo para saber de dónde viene la metodología.">
                <Stack spacing={4} id="sourceReference" tabIndex={-1}>
                    {form.errors.sourceReference && <FormAlert>{form.errors.sourceReference}</FormAlert>}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormField id="source-title" label="Título del documento">
                            <Input maxLength={L.referenceText} value={values.sourceReference.title} onChange={setNested('sourceReference', 'title')} />
                        </FormField>
                        <FormField id="source-institution" label="Institución o autor">
                            <Input maxLength={L.referenceText} value={values.sourceReference.institution} onChange={setNested('sourceReference', 'institution')} />
                        </FormField>
                        <FormField id="source-year" label="Año">
                            <Input type="number" inputMode="numeric" value={values.sourceReference.year} onChange={setNested('sourceReference', 'year')} />
                        </FormField>
                        <FormField id="source-section" label="Sección">
                            <Input maxLength={L.referenceText} value={values.sourceReference.section} onChange={setNested('sourceReference', 'section')} />
                        </FormField>
                        <FormField id="source-pages" label="Páginas">
                            <Input maxLength={30} value={values.sourceReference.pages} onChange={setNested('sourceReference', 'pages')} />
                        </FormField>
                        <FormField id="source-url" label="Enlace (URL)">
                            <Input type="url" inputMode="url" placeholder="https://" value={values.sourceReference.url} onChange={setNested('sourceReference', 'url')} />
                        </FormField>
                    </SimpleGrid>
                    <FormField id="source-notes" label="Notas">
                        <Textarea rows={2} maxLength={L.notes} value={values.sourceReference.notes} onChange={setNested('sourceReference', 'notes')} />
                    </FormField>
                </Stack>
            </SurfaceCard>

            <Flex justify="flex-end" gap={3} wrap="wrap">
                <Button variant="secondary" onClick={onCancel} isDisabled={isSaving}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={isSaving} loadingText="Guardando…">
                    {isEdit ? 'Guardar cambios' : 'Crear metodología'}
                </Button>
            </Flex>
        </Stack>
    )
}
