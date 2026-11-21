import { useCallback, useMemo, useState } from 'react'
import { GuidePlanningContext } from './guidePlanningContext.js'
import { guidePlanningStorage } from '../utils/guidePlanningStorage.js'
import { useAuth } from '../hooks/useAuth.js'

/**
 * Datos que el docente va eligiendo para su próxima guía de clase. Por ahora: la metodología.
 * El futuro módulo de generación de guías leerá `selectedMethodology.id` y lo enviará como
 * `teachingMethodId`.
 *
 * La selección pertenece a un docente: si otro docente inicia sesión en la misma pestaña no la ve.
 */
export const GuidePlanningProvider = ({ children }) => {
    const { teacher } = useAuth()
    const [stored, setStored] = useState(() => guidePlanningStorage.get())
    const teacherId = teacher?.id ?? null

    // Al cerrar sesión se olvida también la copia en memoria (el almacenamiento ya lo limpia AuthContext)
    const [previousTeacherId, setPreviousTeacherId] = useState(teacherId)
    if (previousTeacherId !== teacherId) {
        setPreviousTeacherId(teacherId)
        if (!teacherId) setStored(null)
    }

    const selectedMethodology = stored?.teacherId && stored.teacherId === teacherId ? stored.methodology ?? null : null

    const selectMethodology = useCallback(
        (methodology) => {
            if (!teacherId || !methodology?.id) return
            const value = {
                teacherId,
                methodology: { id: methodology.id, name: methodology.name, isDefault: methodology.isDefault === true, selectedAt: new Date().toISOString() }
            }
            guidePlanningStorage.set(value)
            setStored(value)
        },
        [teacherId]
    )

    const clearMethodology = useCallback(() => {
        guidePlanningStorage.clear()
        setStored(null)
    }, [])

    const value = useMemo(
        () => ({
            selectedMethodology,
            isSelected: (id) => Boolean(id) && selectedMethodology?.id === id,
            selectMethodology,
            clearMethodology
        }),
        [selectedMethodology, selectMethodology, clearMethodology]
    )

    return <GuidePlanningContext.Provider value={value}>{children}</GuidePlanningContext.Provider>
}
