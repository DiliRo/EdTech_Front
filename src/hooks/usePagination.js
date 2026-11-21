import { useState } from 'react'

/**
 * Paginación en el navegador para listas ya cargadas (el backend de aulas y estudiantes no pagina).
 * Si la lista se achica (búsqueda, filtros) la página se ajusta sola a la última disponible.
 */
export const usePagination = (items, pageSize) => {
    const [requestedPage, setPage] = useState(1)
    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(Math.max(requestedPage, 1), totalPages)
    const start = (page - 1) * pageSize
    return {
        page,
        totalPages,
        total,
        pageSize,
        from: total ? start + 1 : 0,
        to: Math.min(start + pageSize, total),
        pageItems: items.slice(start, start + pageSize),
        setPage
    }
}
