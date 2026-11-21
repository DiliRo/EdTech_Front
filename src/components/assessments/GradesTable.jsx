import { useMemo, useState } from 'react'
import {
    Badge,
    Button,
    Flex,
    FormControl,
    FormErrorMessage,
    Input,
    InputGroup,
    InputRightAddon,
    Stack,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VisuallyHidden
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FormAlert } from '../ui/FormAlert.jsx'
import { SegmentedControl } from '../common/SegmentedControl.jsx'
import { MissingGrade } from './Indicators.jsx'
import { CORRECTION_REASON_MAX, OBSERVATIONS_MAX, formatNumber, formatPercent, formatScore, parseScore, percentageOf } from '../../utils/assessment.js'
import { normalizeApiError } from '../../utils/apiError.js'
import { ROUTES } from '../../utils/constants.js'

const initialDraft = (row) => ({
    score: row.existing ? String(row.existing.score) : '',
    observations: row.existing?.observations ?? '',
    reason: ''
})

/** Estado de una fila según lo escrito. */
const evaluateRow = (row, draft, maxScore) => {
    const parsed = parseScore(draft.score, maxScore)
    const observations = draft.observations.trim()
    if (parsed.error) return { kind: 'error', error: parsed.error }
    if (parsed.empty) {
        if (row.existing) return { kind: 'error', error: 'Una calificación registrada no se puede quitar; corrígela con otro valor.' }
        if (observations) return { kind: 'error', error: 'Escribe la nota para guardar la observación.' }
        return { kind: 'empty' }
    }
    if (observations.length > OBSERVATIONS_MAX) return { kind: 'error', error: `Observaciones: máximo ${OBSERVATIONS_MAX} caracteres` }
    if (!row.existing) return { kind: 'new', value: parsed.value }
    if (parsed.value !== row.existing.score || observations !== row.existing.observations) return { kind: 'changed', value: parsed.value }
    return { kind: 'unchanged', value: parsed.value }
}

// Se acepta punto o coma decimal al escribir; se muestra con punto (formato de Guatemala)
const STATUS = {
    new: { label: 'Nueva', bg: 'bg.optionSelected', color: 'text.primary' },
    changed: { label: 'Corrección', bg: 'status.warningBg', color: 'status.warning' },
    error: { label: 'Revisar', bg: 'status.errorBg', color: 'status.error' }
}

const VIEW_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Sin calificación' },
    { value: 'graded', label: 'Calificados' }
]

/**
 * Tabla editable de calificaciones de una evaluación.
 * - Celda vacía = sin calificación (no se envía; no es cero).
 * - Cambiar una nota registrada se guarda como corrección (el backend conserva el valor anterior).
 * - Enter pasa a la nota del siguiente estudiante.
 */
export const GradesTable = ({ assessment, rows, onSave, isReadOnly = false }) => {
    const maxScore = assessment.maxScore
    const [drafts, setDrafts] = useState(() => Object.fromEntries(rows.map((row) => [row.studentId, initialDraft(row)])))
    const [view, setView] = useState('all')
    const [isSaving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [showErrors, setShowErrors] = useState(false)

    const evaluated = useMemo(() => rows.map((row) => ({ row, draft: drafts[row.studentId], state: evaluateRow(row, drafts[row.studentId], maxScore) })), [rows, drafts, maxScore])
    const pending = evaluated.filter((e) => e.state.kind === 'new' || e.state.kind === 'changed')
    const errors = evaluated.filter((e) => e.state.kind === 'error')
    const visible = evaluated.filter((e) => (view === 'pending' ? !e.row.existing : view === 'graded' ? Boolean(e.row.existing) : true))

    const update = (studentId, key, value) => {
        setSaveError(null)
        setDrafts((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [key]: value } }))
    }

    const focusNext = (index) => {
        const next = document.getElementById(`nota-${visible[index + 1]?.row.studentId}`)
        next?.focus()
        next?.select?.()
    }

    const save = async () => {
        setShowErrors(true)
        setSaveError(null)
        if (errors.length) {
            document.getElementById(`nota-${errors[0].row.studentId}`)?.focus()
            return
        }
        if (!pending.length) return
        setSaving(true)
        try {
            await onSave(
                pending.map(({ row, draft, state }) => ({
                    studentId: row.studentId,
                    score: state.value,
                    observations: draft.observations.trim() || undefined,
                    correctionReason: state.kind === 'changed' && draft.reason.trim() ? draft.reason.trim() : undefined
                }))
            )
        } catch (error) {
            const normalized = normalizeApiError(error)
            // Errores por fila del backend: "results[3].score" → se indica el código del estudiante
            const detail = Object.entries(normalized.fieldErrors)
                .map(([field, message]) => {
                    const index = Number(field.match(/^results\[(\d+)\]/)?.[1])
                    const code = Number.isInteger(index) ? pending[index]?.row.studentCode : null
                    return code ? `${code}: ${message}` : message
                })
                .join(' · ')
            setSaveError(detail ? `${normalized.message}. ${detail}` : normalized.message)
            setSaving(false)
            return
        }
        setSaving(false)
    }

    const discard = () => {
        setDrafts(Object.fromEntries(rows.map((row) => [row.studentId, initialDraft(row)])))
        setShowErrors(false)
        setSaveError(null)
    }

    if (!rows.length) return null

    return (
        <Stack spacing={4}>
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={3} align={{ md: 'flex-end' }}>
                <SegmentedControl name="vista-notas" label="Mostrar" options={VIEW_OPTIONS} value={view} onChange={setView} />
                {!isReadOnly && (
                    <Text fontSize="sm" aria-live="polite">
                        {pending.length ? `${pending.length} ${pending.length === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}` : 'Sin cambios pendientes'}
                    </Text>
                )}
            </Flex>

            {showErrors && errors.length > 0 && (
                <FormAlert>
                    {errors.length === 1 ? 'Hay una nota por revisar' : `Hay ${errors.length} notas por revisar`} antes de guardar.
                </FormAlert>
            )}
            <FormAlert>{saveError}</FormAlert>

            <TableContainer borderRadius="md" borderWidth="1px" borderColor="border.subtle" bg="bg.option" whiteSpace="normal">
                <Table size="sm">
                    <VisuallyHidden as="caption">Calificaciones de la evaluación. Nota sobre {formatNumber(maxScore)}.</VisuallyHidden>
                    <Thead>
                        <Tr>
                            <Th scope="col">Código</Th>
                            <Th scope="col" minW="170px">
                                Nota (0 a {formatNumber(maxScore)})
                            </Th>
                            <Th scope="col" isNumeric>
                                Logro
                            </Th>
                            <Th scope="col" minW="200px">
                                Observaciones
                            </Th>
                            <Th scope="col">Estado</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {visible.map(({ row, draft, state }, index) => {
                            const showError = state.kind === 'error' && (showErrors || draft.score !== initialDraft(row).score)
                            const percentage = state.value !== undefined ? percentageOf(state.value, maxScore) : null
                            const status = STATUS[showError ? 'error' : state.kind]
                            return (
                                <Tr key={row.studentId}>
                                    <Td>
                                        <Text as={RouterLink} to={ROUTES.studentProgress(row.studentId)} fontFamily="mono" fontWeight="bold" color="text.primary" textDecoration="underline" fontSize="md">
                                            {row.studentCode}
                                        </Text>
                                        {!row.isActive && (
                                            <Badge ml={2} bg="status.warningBg" color="status.warning" fontSize="0.6rem">
                                                Retirado
                                            </Badge>
                                        )}
                                    </Td>
                                    <Td>
                                        <FormControl isInvalid={showError}>
                                            <InputGroup size="sm">
                                                <Input
                                                    id={`nota-${row.studentId}`}
                                                    aria-label={`Nota de ${row.studentCode} (de 0 a ${formatNumber(maxScore)})`}
                                                    inputMode="decimal"
                                                    autoComplete="off"
                                                    value={draft.score}
                                                    placeholder="Sin nota"
                                                    isReadOnly={isReadOnly}
                                                    onChange={(e) => update(row.studentId, 'score', e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            focusNext(index)
                                                        }
                                                    }}
                                                />
                                                <InputRightAddon bg="bg.surfaceMuted" color="text.primary" borderColor="border.subtle">
                                                    / {formatNumber(maxScore)}
                                                </InputRightAddon>
                                            </InputGroup>
                                            {showError && <FormErrorMessage fontSize="xs">{state.error}</FormErrorMessage>}
                                        </FormControl>
                                        {state.kind === 'changed' && row.existing && (
                                            <Stack spacing={1} mt={2}>
                                                <Text fontSize="xs">Antes: {formatScore(row.existing.score, maxScore)}</Text>
                                                <Input
                                                    size="xs"
                                                    aria-label={`Motivo de la corrección de ${row.studentCode} (opcional)`}
                                                    placeholder="Motivo de la corrección (opcional)"
                                                    maxLength={CORRECTION_REASON_MAX}
                                                    value={draft.reason}
                                                    onChange={(e) => update(row.studentId, 'reason', e.target.value)}
                                                />
                                            </Stack>
                                        )}
                                    </Td>
                                    <Td isNumeric>{percentage !== null ? formatPercent(percentage) : <MissingGrade />}</Td>
                                    <Td>
                                        <Input
                                            size="sm"
                                            aria-label={`Observaciones de ${row.studentCode}`}
                                            maxLength={OBSERVATIONS_MAX}
                                            value={draft.observations}
                                            isReadOnly={isReadOnly}
                                            onChange={(e) => update(row.studentId, 'observations', e.target.value)}
                                        />
                                    </Td>
                                    <Td>
                                        {status ? (
                                            <Badge bg={status.bg} color={status.color} textTransform="none">
                                                {status.label}
                                            </Badge>
                                        ) : row.existing ? (
                                            <Stack spacing={0}>
                                                <Badge bg="bg.surfaceMuted" color="text.primary" textTransform="none" w="fit-content">
                                                    Registrada
                                                </Badge>
                                                {row.existing.corrections.length > 0 && (
                                                    <Text fontSize="xs">
                                                        Corregida {row.existing.corrections.length} {row.existing.corrections.length === 1 ? 'vez' : 'veces'}
                                                    </Text>
                                                )}
                                            </Stack>
                                        ) : (
                                            <MissingGrade />
                                        )}
                                    </Td>
                                </Tr>
                            )
                        })}
                    </Tbody>
                </Table>
            </TableContainer>
            {visible.length === 0 && <Text fontSize="sm">No hay estudiantes en esta vista.</Text>}

            {!isReadOnly && (
                <Flex justify="flex-end" gap={3} wrap="wrap">
                    <Button variant="secondary" onClick={discard} isDisabled={isSaving || (!pending.length && !errors.length)}>
                        Descartar cambios
                    </Button>
                    <Button onClick={save} isLoading={isSaving} loadingText="Guardando…" isDisabled={!pending.length && !errors.length}>
                        Guardar calificaciones
                    </Button>
                </Flex>
            )}
        </Stack>
    )
}
