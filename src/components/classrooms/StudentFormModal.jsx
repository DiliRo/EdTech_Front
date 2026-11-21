import { useRef, useState } from 'react'
import { Button, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text } from '@chakra-ui/react'
import { FormField } from '../ui/FormField.jsx'
import { FormAlert } from '../ui/FormAlert.jsx'
import { useFormState } from '../../hooks/useFormState.js'
import { addStudent, updateStudentCode } from '../../services/student.service.js'
import { STUDENT_CODE_MAX, normalizeStudentCode, validateStudentCode } from '../../utils/classroom.js'

const StudentForm = ({ classroomId, student, onClose, onSaved, inputRef }) => {
    const isEdit = Boolean(student)
    const form = useFormState({ studentCode: student?.studentCode ?? '' })
    const [isSaving, setSaving] = useState(false)
    const [message, setMessage] = useState(null) // { status, text }
    const keepOpen = useRef(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setMessage(null)
        if (!form.validate({ studentCode: validateStudentCode(form.values.studentCode) })) return

        const code = normalizeStudentCode(form.values.studentCode)
        if (isEdit && code === student.studentCode) {
            setMessage({ status: 'info', text: 'El código no cambió.' })
            return
        }

        setSaving(true)
        try {
            const saved = isEdit ? await updateStudentCode(student.id, code) : await addStudent(classroomId, { studentCode: code })
            setSaving(false)
            if (keepOpen.current) {
                // "Agregar y continuar": el formulario queda listo para el siguiente código
                form.reset({ studentCode: '' })
                setMessage({ status: 'success', text: `Se agregó el código ${saved.studentCode}.` })
                inputRef.current?.focus()
                onSaved(saved, { keepOpen: true })
            } else {
                onSaved(saved, { keepOpen: false })
            }
        } catch (error) {
            form.applyServerError(error)
            setSaving(false)
        }
    }

    return (
        <ModalContent as="form" onSubmit={handleSubmit} noValidate>
            <ModalHeader>{isEdit ? 'Editar código del estudiante' : 'Agregar estudiante'}</ModalHeader>
            <ModalCloseButton aria-label="Cerrar" isDisabled={isSaving} />
            <ModalBody>
                <Stack spacing={4}>
                    <Text fontSize="sm">
                        Los estudiantes no tienen cuenta ni datos personales: se identifican solo con el código que tú asignas. El código no se
                        repite dentro del aula.
                        {isEdit && ' Cambiar el código no afecta su historial.'}
                    </Text>
                    {message && <FormAlert status={message.status}>{message.text}</FormAlert>}
                    <FormAlert>{form.formError}</FormAlert>
                    <FormField
                        id="studentCode"
                        label="Código del estudiante"
                        error={form.errors.studentCode}
                        helper="Letras sin tilde, números, guion o guion bajo, sin espacios. Ej.: A01, MAT-03"
                        isRequired
                    >
                        <Input
                            ref={inputRef}
                            maxLength={STUDENT_CODE_MAX}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            textTransform="uppercase"
                            fontFamily="mono"
                            {...form.field('studentCode')}
                        />
                    </FormField>
                </Stack>
            </ModalBody>
            <ModalFooter flexWrap="wrap">
                <Button variant="secondary" onClick={onClose} isDisabled={isSaving}>
                    {message?.status === 'success' ? 'Terminar' : 'Cancelar'}
                </Button>
                {!isEdit && (
                    <Button type="submit" variant="secondary" isDisabled={isSaving} onClick={() => (keepOpen.current = true)}>
                        Agregar y continuar
                    </Button>
                )}
                <Button type="submit" isLoading={isSaving} loadingText="Guardando…" onClick={() => (keepOpen.current = false)}>
                    {isEdit ? 'Guardar código' : 'Agregar'}
                </Button>
            </ModalFooter>
        </ModalContent>
    )
}

/**
 * Agregar un estudiante o editar su código. Es el ÚNICO dato que se pide: nada de nombres,
 * correos ni contraseñas.
 */
export const StudentFormModal = ({ isOpen, onClose, classroomId, student = null, onSaved }) => {
    const inputRef = useRef(null)
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered closeOnOverlayClick={false} initialFocusRef={inputRef}>
            <ModalOverlay />
            {isOpen && (
                <StudentForm key={student?.id ?? 'new'} classroomId={classroomId} student={student} onClose={onClose} onSaved={onSaved} inputRef={inputRef} />
            )}
        </Modal>
    )
}
