import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { normalizeApiError } from '../utils/apiError.js'

/**
 * Consulta que depende de una clave (p. ej. el grado seleccionado).
 *
 * - `key` null/undefined → no consulta (status 'idle').
 * - Al cambiar la clave vuelve a consultar; mientras tanto status es 'loading' y no se muestran
 *   datos de la clave anterior.
 * - Ignora respuestas que llegan tarde de claves anteriores.
 * - `run()` reintenta (para el botón "Reintentar"); el nombre coincide con useAsync para que
 *   funcione con AsyncContent.
 *
 * @param {string|null|undefined} key
 * @param {() => Promise<any>} fetcher  siempre se usa la última versión
 */
export const useQuery = (key, fetcher) => {
    const [attempt, setAttempt] = useState(0)
    const [result, setResult] = useState({ key: null, attempt: -1, status: 'idle', data: null, error: null })
    const fetcherRef = useRef(fetcher)

    useLayoutEffect(() => {
        fetcherRef.current = fetcher
    })

    useEffect(() => {
        if (key == null) return undefined
        let active = true
        Promise.resolve()
            .then(() => fetcherRef.current())
            .then(
                (data) => active && setResult({ key, attempt, status: 'success', data, error: null }),
                (error) => active && setResult({ key, attempt, status: 'error', data: null, error: normalizeApiError(error) })
            )
        return () => {
            active = false
        }
    }, [key, attempt])

    const run = useCallback(() => setAttempt((value) => value + 1), [])

    const isCurrent = key != null && result.key === key && result.attempt === attempt
    const status = key == null ? 'idle' : isCurrent ? result.status : 'loading'

    return {
        status,
        data: isCurrent ? result.data : null,
        error: isCurrent ? result.error : null,
        isIdle: status === 'idle',
        isLoading: status === 'loading',
        isSuccess: status === 'success',
        isError: status === 'error',
        run
    }
}
