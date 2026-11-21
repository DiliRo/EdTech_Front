import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { normalizeApiError } from '../utils/apiError.js'

/**
 * Estado de una operación asíncrona: idle → loading → success | error.
 * Ignora resultados de llamadas anteriores si se vuelve a ejecutar o si el componente se desmonta.
 *
 * @param {(...args: any[]) => Promise<any>} asyncFn
 * @param {{ immediate?: boolean }} [options]  `immediate` ejecuta al montar
 */
export const useAsync = (asyncFn, { immediate = false } = {}) => {
    const [state, setState] = useState({ status: immediate ? 'loading' : 'idle', data: null, error: null })
    const callId = useRef(0)
    const mounted = useRef(false)
    const fnRef = useRef(asyncFn)

    // Siempre la última versión de la función, sin volver a crear `run`
    useLayoutEffect(() => {
        fnRef.current = asyncFn
    })

    /** Ejecuta la función; solo actualiza el estado cuando la promesa termina. */
    const execute = useCallback((args) => {
        const id = ++callId.current
        const isCurrent = () => mounted.current && id === callId.current
        return Promise.resolve()
            .then(() => fnRef.current(...args))
            .then(
                (data) => {
                    if (isCurrent()) setState({ status: 'success', data, error: null })
                    return data
                },
                (err) => {
                    if (isCurrent()) setState({ status: 'error', data: null, error: normalizeApiError(err) })
                    return undefined
                }
            )
    }, [])

    /** Para usar en eventos (botón "Reintentar", envío de formularios). */
    const run = useCallback(
        (...args) => {
            setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
            return execute(args)
        },
        [execute]
    )

    useEffect(() => {
        mounted.current = true
        if (immediate) execute([])
        return () => {
            mounted.current = false
        }
    }, [immediate, execute])

    return {
        ...state,
        isIdle: state.status === 'idle',
        isLoading: state.status === 'loading',
        isSuccess: state.status === 'success',
        isError: state.status === 'error',
        run
    }
}
