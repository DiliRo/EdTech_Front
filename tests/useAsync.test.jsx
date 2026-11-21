import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAsync } from '../src/hooks/useAsync.js'

describe('useAsync', () => {
    it('con immediate empieza cargando y termina con los datos', async () => {
        const { result } = renderHook(() => useAsync(async () => ['a'], { immediate: true }))
        expect(result.current.status).toBe('loading')
        await waitFor(() => expect(result.current.status).toBe('success'))
        expect(result.current.data).toEqual(['a'])
    })

    it('sin immediate queda en espera hasta llamar a run', async () => {
        const fn = vi.fn(async (x) => x * 2)
        const { result } = renderHook(() => useAsync(fn))
        expect(result.current.isIdle).toBe(true)
        expect(fn).not.toHaveBeenCalled()

        let value
        await act(async () => {
            value = await result.current.run(21)
        })
        expect(value).toBe(42)
        expect(result.current.data).toBe(42)
    })

    it('normaliza el error y permite reintentar', async () => {
        let fail = true
        const fn = async () => {
            if (fail) throw { response: { status: 500, data: { message: 'Falló' } } }
            return 'ok'
        }
        const { result } = renderHook(() => useAsync(fn, { immediate: true }))
        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(result.current.error).toMatchObject({ status: 500, message: 'Falló' })

        fail = false
        await act(async () => {
            await result.current.run()
        })
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.error).toBeNull()
    })

    it('ignora respuestas viejas si se vuelve a ejecutar', async () => {
        const resolvers = []
        const fn = () => new Promise((resolve) => resolvers.push(resolve))
        const { result } = renderHook(() => useAsync(fn))

        act(() => {
            result.current.run()
            result.current.run()
        })
        await waitFor(() => expect(resolvers).toHaveLength(2))
        await act(async () => {
            resolvers[1]('nueva')
            resolvers[0]('vieja')
        })
        expect(result.current.data).toBe('nueva')
    })
})
