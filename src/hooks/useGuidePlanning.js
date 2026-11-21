import { useContext } from 'react'
import { GuidePlanningContext } from '../context/guidePlanningContext.js'

/** Metodología elegida para la próxima guía de clase. */
export const useGuidePlanning = () => {
    const context = useContext(GuidePlanningContext)
    if (!context) throw new Error('useGuidePlanning debe usarse dentro de <GuidePlanningProvider>')
    return context
}
