import { lazy, Suspense } from 'react'
import { LoadingState } from '../feedback/LoadingState.jsx'

// Recharts se descarga solo cuando hay un gráfico que mostrar (no en el resto de la aplicación)
const PercentChart = lazy(() => import('./PercentChart.jsx').then((module) => ({ default: module.PercentChart })))

/** Gráfico de evolución cargado bajo demanda. Mismas props que PercentChart. */
export const LazyPercentChart = (props) => (
    <Suspense fallback={<LoadingState message="Cargando gráfico…" minH="300px" />}>
        <PercentChart {...props} />
    </Suspense>
)
