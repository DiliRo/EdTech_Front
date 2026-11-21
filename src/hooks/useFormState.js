import { useCallback, useState } from 'react'

/**
 * Estado de un formulario: valores, errores por campo y error general.
 *
 * - `field(name)` devuelve { value, onChange } para conectar un Input o Select.
 * - `validate({ campo: mensaje|null })` guarda los errores y enfoca el primer campo inválido
 *   (los campos deben tener `id` igual a su nombre).
 * - `applyServerError(error)` muestra los errores por campo que devuelve el backend.
 */
export const useFormState = (initialValues) => {
    const [values, setValues] = useState(initialValues)
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState(null)

    const setValue = useCallback((name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
        setFormError(null)
    }, [])

    const field = (name) => ({
        value: values[name] ?? '',
        onChange: (event) => setValue(name, event.target.value)
    })

    const focusField = (name) => {
        const element = typeof document !== 'undefined' ? document.getElementById(name) : null
        element?.focus()
    }

    const validate = (validators) => {
        const found = Object.fromEntries(Object.entries(validators).filter(([, message]) => Boolean(message)))
        setErrors(found)
        const [first] = Object.keys(found)
        if (first) focusField(first)
        return !first
    }

    const applyServerError = (error) => {
        // El backend puede marcar elementos o subcampos (p. ej. "subjectIds[2]", "steps[0].description"): se asignan al campo
        const known = {}
        const unknown = []
        for (const [name, message] of Object.entries(error?.fieldErrors ?? {})) {
            const base = name.replace(/[[.].*$/, '')
            if (base in values) known[base] ??= message
            else unknown.push(message)
        }
        setErrors(known)
        const [first] = Object.keys(known)
        if (first) focusField(first)
        // Arriba del formulario: el mensaje general si ningún error es de un campo visible
        setFormError(first ? (unknown.length ? unknown.join('. ') : null) : error?.message ?? null)
    }

    const reset = useCallback((next) => {
        setValues(next)
        setErrors({})
        setFormError(null)
    }, [])

    return { values, errors, formError, setFormError, setValue, field, validate, applyServerError, reset }
}
